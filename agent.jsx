var LogBox = React.createClass({
  render: function() {
    return (
      <div>
        <div className="log">{this.props.text}</div>
        <p>{this.props.smallText}</p>
      </div>
    );
  }
});

var AvailableButton = React.createClass({
  render: function() {
    return (
      <button className={'btn btn-success '}
          onClick={this.props.handleOnClick} disabled={this.props.disabled}>
        Toggle Avaliability
      </button>
    );
  }
});

var AcceptReservationButton = React.createClass({
  render: function() {
    return (
      <button className={'btn btn-success'}
          onClick={this.props.handleOnClick} disabled={this.props.disabled}>
      Accept
      </button>
    );
  }
});

var RejectReservationButton = React.createClass({
  render: function() {
    return (
      <button className={'btn btn-danger'}
          onClick={this.props.handleOnClick} disabled={this.props.disabled}>
      Reject
      </button>
    );
  }
});

var CallButton = React.createClass({
  render: function() {
    return (
      <button className={'btn btn-circle btn-success ' + (this.props.onPhone ? 'btn-danger': 'btn-success')}
          onClick={this.props.handleOnClick} disabled={this.props.disabled}>
        <i className={'fa fa-fw fa-phone '+ (this.props.onPhone ? 'fa-close': 'fa-phone')}></i>
      </button>
    );
  }
});

var MuteButton = React.createClass({
  render: function() {
    return (
      <button className="btn btn-circle btn-default" onClick={this.props.handleOnClick}>
        <i className={'fa fa-fw fa-microphone ' + (this.props.muted ? 'fa-microphone-slash': 'fa-microphone')}></i>
      </button>
    );
  }
});

var AgentApp = React.createClass({
  getInitialState() {
    return {
      log: 'Connecting...',
      available: false,
      onPhone: false,
      reserved: false,
      reservation: false,
      worker: false
    }
  },

  // Initialize after component creation
  componentDidMount() {
    var self = this;

    // Fetch worker Twilio capability token from our Node.js server
    $.getJSON('https://free-letter-3668.twil.io/workerToken')
     .done(function(data) {
        var worker = new Twilio.TaskRouter.Worker(data.token);
        console.log('Created Worker: ', worker);
        self.setState({worker: worker});

        worker.on("connected", function() {
          console.log("Websocket has connected");
        });

        worker.on("ready", function(worker) {
          if (worker.available) {
            self.setState({
              log: `Ready to accept calls.`,
              available: true
            });
          } else {
            self.setState({
              log: `Offline. Please Toggle Avaliability`,
              available: false
            });
          }
          console.log(worker.sid)             // 'WKxxx'
          console.log(worker.friendlyName)    // 'Worker 1'
          console.log(worker.activityName)    // 'Reserved'
          console.log(worker.available)       // false
        });

        worker.on('activity.update', function(worker) {
            console.log(`Worker activity changed to: ${worker.activityName}. Available:${worker.available}`);
            self.setState({
                available: worker.available
            });
        });

        worker.on("reservation.created", function(reservation) {
            console.log("You have been reserved to handle a call!");
            console.log(reservation);
            self.setState({reserved: true,
              log: 'Incoming Reservation...',
              reserved: true,
              reservation: reservation
              });
        });

        worker.on("reservation.accepted", function(reservation) {
            console.log("Reservation " + reservation.sid + " accepted!");
            self.setState({reserved: true,
              log: 'Reservation Accepted joining call',
              reserved: true,
              });
        });

        worker.on("reservation.rejected", function(reservation) {
            console.log("Reservation " + reservation.sid + " rejected!");
            self.setState({reserved: true,
              log: 'Reservation Rejected. Awaiting Next Call',
              reserved: false,
            });
        });

        worker.on("reservation.timeout", function(reservation) {
            console.log("Reservation " + reservation.sid + " timed out!");
            self.setState({
              log: 'Reservation timeout. Awaiting Next Call',
              reserved: false,
            });
        });

        worker.on("reservation.canceled", function(reservation) {
            console.log("Reservation " + reservation.sid + " canceled!");
            self.setState({
              log: 'Reservation Cancelled. Awaiting Next Call',
              reserved: false,
            });
        });

        worker.on("reservation.completed", function(reservation) {
            console.log("Reservation " + reservation.sid + " Complete!");
            self.setState({
              log: 'Reservation Completed. Awaiting Next Call',
              reserved: false,
            });
        });
    }).fail(function(err) {
      console.log(err);
      self.setState({log: 'Could not fetch  Worker token, see console.log'});
    });

    // Fetch Twilio capability token from our Node.js server
    $.getJSON('https://free-letter-3668.twil.io/agentClientToken')
      .done(function(data) {
        Twilio.Device.setup(data.token);
      }).fail(function(err) {
        console.log(err);
        self.setState({log: 'Could not fetch token, see console.log'});
      });

      // Configure event handlers for Twilio Device
      Twilio.Device.disconnect(function() {
        self.setState({
          onPhone: false,
          log: 'Call ended.'
        });
      });

      Twilio.Device.ready(function() {
        self.log = 'Connected';
        console.log('Client Ready for Connections')
      });

      Twilio.Device.error(function (error) {
        console.log('Twilio.Device Error: ' + error.message);
      });

      Twilio.Device.connect(function (conn) {
        console.log('Successfully established call!');
        self.setState({
          muted: false,
          onPhone: true
        })

      });

      Twilio.Device.disconnect(function (conn) {
        console.log('Call ended.');
        self.setState({
          muted: false,
          onPhone: false
        })
      });

      Twilio.Device.incoming(function (conn) {
        console.log('Incoming connection from ' + conn.parameters.From);
        self.log = 'Incoming connection from ' + conn.parameters.From
        conn.accept();
        self.setState({
          muted: false,
          onPhone: true
        })
      });

  },

  // Set the agent available or not by joining Idle or Offline Acttivities
  handleToggleAvailable() {
    var worker = this.state.worker;
    console.log(worker)
    if (!this.state.available) {
        console.log('Setting Agent Avaliable')
        worker.update("ActivitySid", "WA175dc1ca1d0090f43d94780bc2e48625", function(error, worker) {
          if(error) {
            console.log(error.code);
            console.log(error.message);
          } else {
            console.log(`Worker activity set to: ${worker.activityName}. Available:${worker.available}`)
          }
        });
        this.setState({
          avaliable: true,
          log: 'Agent Available'
        })
      } else {
        console.log("Setting Agent Offline")
        worker.update("ActivitySid", "WAf4ac81fb9325d8aa1ad7927b3ccced16", function(error, worker) {
          if(error) {
            console.log(error.code);
            console.log(error.message);
          } else {

            console.log(`Worker activity set to: ${worker.activityName}. Available:${worker.available}`)
          }
        });
        this.setState({
          avaliable: false,
          log: 'Agent Not Available'
        })
      }
  },


  // Accept Reservation via dequeue and place call to client.
  handleAcceptReservation() {
        var reservation = this.state.reservation;
        reservation.dequeue(
          "+61361446007",
          "WA175dc1ca1d0090f43d94780bc2e48625",
          null,
          "30",
          null,
          null,
          "client:TheAgent",
          function(error, reservation) {
              if(error) {
                  console.log(error.code);
                  console.log(error.message);
                  return;
              }
              console.log("reservation dequeued");
          }
      );
  },

  // Reject Reservation
  handleRejectReservation() {
        var reservation = this.state.reservation;
        reservation.reject(
            function(error, reservation) {
                if(error) {
                    console.log(error.code);
                    console.log(error.message);
                    return;
                }
                console.log("reservation rejected");
                for (var property in reservation) {
                    console.log(property+" : "+reservation[property]);
                }
            }
          );
  },

  // Handle muting
  handleToggleMute() {
    var muted = !this.state.muted;
    this.setState({muted: muted});
    Twilio.Device.activeConnection().mute(muted);
  },

  //Hangup The Current Call
  handleToggleCall() {
    if (this.state.onPhone) {
      var worker = this.state.worker;
      console.log('Complete Reservation')
      worker.update("ActivitySid", "WA175dc1ca1d0090f43d94780bc2e48625", function(error, worker) {
        console.log(`Worker ${worker.friendlyName} has ended the call.`);
        Twilio.Device.disconnectAll();
        if(error) {
          console.log(error.code);
          console.log(error.message);
        } else {
          console.log(worker.activityName); // "Idle"
        }
      });

      this.setState({
        muted: false,
        onPhone: false,
        reserved: false
      })
    }
  },

  render: function() {
    var self = this;

    return (
      <div id="agent">
        <div className="allcontrols">
          <AvailableButton handleOnClick={this.handleToggleAvailable}/>
          <div className="reservations">
            <AcceptReservationButton handleOnClick={this.handleAcceptReservation} disabled={!this.state.reserved}/>
            <RejectReservationButton handleOnClick={this.handleRejectReservation} disabled={!this.state.reserved}/>
          </div>

          <div className="callcontrols">
            <CallButton handleOnClick={this.handleToggleCall} disabled={!this.state.onPhone} onPhone={this.state.onPhone}/>

            { this.state.onPhone ? <MuteButton handleOnClick={this.handleToggleMute} muted={this.state.muted} /> : null }

          </div>
        </div>

        <LogBox text={this.state.log}/>

      </div>
    );
  }
});

ReactDOM.render(
  <AgentApp/>,
  document.getElementById('agent-app')
);
