// Author Toby Allen 
// https://twitter.com/tobyallen
// https://www.linkedin.com/in/tobyallen11/
// Copyright 2018

class MediaSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Default resolution of media constraints
      height: 1080,
      width: 1920,
      // The device selected video device ID
      selectedVideoDevice: "",
      // The device selected audio device ID
      selectedAudioDevice: "",
      previewStream: "",
      devices: []
    }
    // This binding is necessary to make `this` work in the callback
    this.handleMediaChange = this.handleMediaChange.bind(this);
  }

  // Initialize after component creation
  componentDidMount() {
    //Get the devices from mediaDevices.
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          this.setState({devices: [devices]})
        })
        .catch(error => console.error(error))

    //Add an event listener to monitor for changes to the device list.
    navigator.mediaDevices.addEventListener('devicechange', navigator.mediaDevices.enumerateDevices()
      .then(devices => (this.setState({devices: devices})))
      .catch(error => console.error(error))
    );
  }

  handleMediaChange(event) {
    var video, audio = false;
    var videoDeviceId = this.state.selectedVideoDevice;
    var audioDeviceId = this.state.selectedAudioDevice;

    if (event.target.name == 'video') {
      videoDeviceId = event.target.value;
      this.setState({selectedVideoDevice: event.target.value});
    }

    var video = (videoDeviceId != "") ? {
        deviceId: {
          exact: videoDeviceId
        },
        height: this.state.height,
        width: this.state.width
      } : false;

    if (event.target.name == 'audio') {
      audioDeviceId = event.target.value;
      this.setState({selectedAudioDevice: event.target.value});
    }

    var audio = (audioDeviceId != "") ? {
        deviceId: {
          exact: audioDeviceId
        }
      } : false;

    var constraints = {
          video,
          audio
    };

    if (constraints.video || constraints.audio) {
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          this.setState({previewStream: window.URL.createObjectURL(stream)});
          const videoTracks = stream.getVideoTracks();
          console.log(`Using video device: ${videoTracks[0].label}`);
          const audioTracks = stream.getAudioTracks();
          console.log(`Using audio device: ${audioTracks[0].label}`);
        })
        .catch(error => console.error(error))
    }
  }

  render() {
    var mappedVideoSelectList = this.state.devices
      .filter(device => device.kind === 'videoinput')
      .map(function(device) {
        return <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
    });

    var mappedAudioSelectList = this.state.devices
      .filter(device => device.kind === 'audioinput')
      .map(function(device) {
        return <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
      });

    return (
      <div id="selector">
        <video src={this.state.previewStream} autoPlay muted></video>
        <label>
          Video
          <select name='video' value={this.state.selectedVideoDevice} onChange={this.handleMediaChange}>
            {mappedVideoSelectList}
            <option value="">None</option>
          </select>
        </label>
        <label>
          Audio
          <select name='audio' value={this.state.selectedAudioDevice} onChange={this.handleMediaChange}>
              {mappedAudioSelectList}
            <option value="">None</option>
          </select>
        </label>
      </div>
    );
  }
}

ReactDOM.render(
  <MediaSelector/>,
  document.getElementById('media-selector')
);
