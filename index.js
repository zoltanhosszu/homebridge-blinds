var request = require("request");
var exec = require("child_process").exec;
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-blinds-cmd-zh", "BlindsCMDZH", BlindsCmDZHAccessory);
}

function BlindsCmDZHAccessory(log, config) {
    // global vars
    this.log = log;

    // configuration vars
    this.name = config["name"];
    this.upURL = config["up_cmd"];
    this.downURL = config["down_cmd"];
    this.stopURL = config["stop_cmd"];
    this.motionTime = config["motion_time"];
    
    //this.stopAtBoundaries = config["trigger_stop_at_boundaries"];

    // state vars
    this.interval = null;
    this.timeout = null;
    this.lastPosition = 0; // last known position of the blinds, down by default
    this.currentPositionState = 2; // stopped by default
    this.currentTargetPosition = 0; // down by default

    // register the service and provide the functions
    this.service = new Service.WindowCovering(this.name);

    // the current position (0-100%)
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L493
    this.service
        .getCharacteristic(Characteristic.CurrentPosition)
        .on('get', this.getCurrentPosition.bind(this));

    // the position state
    // 0 = DECREASING; 1 = INCREASING; 2 = STOPPED;
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L1138
    this.service
        .getCharacteristic(Characteristic.PositionState)
        .on('get', this.getPositionState.bind(this));

    // the target position (0-100%)
    // https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js#L1564
    this.service
        .getCharacteristic(Characteristic.TargetPosition)
        .on('get', this.getTargetPosition.bind(this))
        .on('set', this.setTargetPosition.bind(this));
}

BlindsCmDZHAccessory.prototype.getCurrentPosition = function(callback) {
    this.log("Requested CurrentPosition: %s", this.lastPosition);
    callback(null, this.lastPosition);
}

BlindsCmDZHAccessory.prototype.getPositionState = function(callback) {
    this.log("Requested PositionState: %s", this.currentPositionState);
    callback(null, this.currentPositionState);
}

BlindsCmDZHAccessory.prototype.getTargetPosition = function(callback) {
    this.log("Requested TargetPosition: %s", this.currentTargetPosition);
    callback(null, this.currentTargetPosition);
}

BlindsCmDZHAccessory.prototype.setTargetPosition = function(pos, callback) {
    this.log("Set TargetPosition: %s", pos);
    this.currentTargetPosition = pos;
    if (this.currentTargetPosition == this.lastPosition) {
        if (this.interval != null) clearInterval(this.interval);
        if (this.timeout != null) clearTimeout(this.timeout);
        this.log("Already here");
        callback(null);
        return;
    }
    const moveUp = (this.currentTargetPosition >= this.lastPosition);
    this.log((moveUp ? "Moving up" : "Moving down"));

    this.service
        .setCharacteristic(Characteristic.PositionState, (moveUp ? 1 : 0));

    this.cmd((moveUp ? this.upURL : this.downURL), function() {
        this.log(
            "Success moving %s",
            (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
        );
        this.service
            .setCharacteristic(Characteristic.CurrentPosition, pos);
        this.service
            .setCharacteristic(Characteristic.PositionState, 2);
    }.bind(this));

    var localThis = this;
    if (this.interval != null) clearInterval(this.interval);
    if (this.timeout != null) clearTimeout(this.timeout);
    this.interval = setInterval(function(){
        localThis.lastPosition += (moveUp ? 1 : -1);
        if (localThis.lastPosition == localThis.currentTargetPosition) {
            if (localThis.currentTargetPosition != 0 && localThis.currentTargetPosition != 100) {
                localThis.cmd(localThis.stopURL, function() {
                    localThis.log(
                        "Success stop moving %s",
                        (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
                    );
                    localThis.service
                        .setCharacteristic(Characteristic.CurrentPosition, pos);
                    localThis.service
                        .setCharacteristic(Characteristic.PositionState, 2);
                    localThis.lastPosition = pos;
                }.bind(localThis));
            }
            clearInterval(localThis.interval);
        }
    }, parseInt(this.motionTime) / 100);
    /*if (this.stopAtBoundaries && (this.currentTargetPosition == 0 || this.currentTargetPosition == 100)) {
        this.timeout = setTimeout(function() {
            localThis.cmd(localThis.stopURL, function() {
                localThis.log(
                    "Success stop adjusting moving %s",
                    (moveUp ? "up (to " + pos + ")" : "down (to " + pos + ")")
                );
            }.bind(localThis));
        }, parseInt(this.motionTime));
    }*/
    callback(null);
}

BlindsCmDZHAccessory.prototype.cmd = function(comm, callback) {
  exec(comm, function(error) {
    callback(error)
  });
}

/*
BlindsCmDZHAccessory.prototype.cmd = function(url, callback) {
    request({
        method: method,
        url: url,
    }, function(err, response, body) {
        if (!err && response && response.statusCode == 200) {
            callback(null);
        } else {
            this.log(
                "Error getting state (status code %s): %s",
                (response ? response.statusCode : "not defined"),
                err
            );
            callback(err);
        }
    }.bind(this));
}


BlindsCmDZHAccessory.prototype.cmd = function(moveUp, cmd, callback) {
  this.currentPositionState = (moveUp ? Characteristic.PositionState.INCREASING : Characteristic.PositionState.DECREASING);
  this.service
    .setCharacteristic(Characteristic.PositionState, (moveUp ? Characteristic.PositionState.INCREASING : Characteristic.PositionState.DECREASING));

  exec(cmd, function(error, stdout, stderr) {
    callback(error, stdout, stderr)
  });
}*/


BlindsCmDZHAccessory.prototype.getServices = function() {
    return [this.service];
}
