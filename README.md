# homebridge-blinds-cmd-zh

`homebridge-blinds` is a plugin for Homebridge.

## Installation

If you are new to Homebridge, please first read the Homebridge [documentation](https://www.npmjs.com/package/homebridge).
If you are running on a Raspberry, you will find a tutorial in the [homebridge-punt Wiki](https://github.com/cflurin/homebridge-punt/wiki/Running-Homebridge-on-a-Raspberry-Pi).

Install homebridge:
```sh
sudo npm install -g homebridge
```
Install homebridge-blinds:
```sh
sudo npm install -g homebridge-blinds-cmd-zh
```

## Configuration

Add the accessory in `config.json` in your home directory inside `.homebridge`.

```js
    {
      "accessory": "BlindsCMDZH",
      "name": "Window",
      "up_cmd": "./up.sh",
      "down_cmd": "./down.sh",
      "stop_cmd": "./stop.sh",
      "motion_time": "<time your blind needs to move from up to down (in milliseconds)>"
    }
```


Feel free to contribute to make this a better plugin!
