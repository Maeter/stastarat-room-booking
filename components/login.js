import React, {Component} from 'react';
// import {LoginManager} from 'react-native-fbsdk';
import {GoogleSignin} from 'react-native-google-signin';
import {TouchableOpacity, Text, View, TextInput} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';

import 'moment/locale/es';

moment.locale('es');

const EVENT_START_STRING = 'Start';
const EVENT_END_STRING = 'End';

export default class LogIn extends Component {

  constructor() {
    super();
    this.state = {
      user: null,
      calendarId: 'k9tpco1fp5vss8usgo45ptd18k@group.calendar.google.com',
      targetCalendar: '3bicaa4524gdtavsk41hvrn4v8@group.calendar.google.com',
      calendar: null,
      isDateTimePickerVisible: false,
      isSelectingStartOrEnd: 'start',
      eventName: null,
      eventDesc: null,
      eventTime: null,
      [`event${EVENT_START_STRING}`]: null,
      [`event${EVENT_END_STRING}`]: null,
    }
    this.googleAuth = this.googleAuth.bind(this);
    this.requestCal = this.requestCal.bind(this);
    this.createOwnCalendar = this.createOwnCalendar.bind(this);
    this.postEvent = this.postEvent.bind(this);
    this.showDateTimePicker = this.showDateTimePicker.bind(this);
    this.hideDateTimePicker = this.hideDateTimePicker.bind(this);
    this.handleDatePicked = this.handleDatePicked.bind(this);
    this.renderPrivateContent = this.renderPrivateContent.bind(this);
  }
  componentDidMount() {
    this.setupGoogleSignin();
  }

  // Pedir calendario con el nombre 'Mis reservas de sala de Stastarat',
  requestCal() {
    // fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.state.calendarId}/events`, {
    return fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.state.user.accessToken}`,
      },
    })
    .then(data => JSON.parse(data._bodyInit)) // get the actual calendar data from the request
    .then(parsedData => {
      const ownCalArr = parsedData.items.filter(cal => cal.summary === 'Mis reservas de sala de Stastarat');
      return ownCalArr.length > 0 ? ownCalArr[0] : null;
    }); // save it to state
  }

  postEvent() {
    const format = 'YYYY-MM-DDTHH:mm:ss';
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.state.calendar.id}/events`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.state.user.accessToken}`,
      },
      body: JSON.stringify({
        summary: this.state.eventName,
        location: 'Carrer d\'Arenys de Mar, 14, 08225 Terrassa, Barcelona',
        description: this.state.eventDesc,
        start: {
          dateTime: this.state[`event${EVENT_START_STRING}`].format(format), // '2018-03-17T02:00:00',
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime:  this.state[`event${EVENT_END_STRING}`].format(format),
          timeZone: 'Europe/Madrid',
        },
        attachments: [],
        attendees: [{email: 'lmfernandezb@gmail.com'}], // <- Aqui deberia ir stastarat@gmail.com
        reminders: { overrides: [] },
      }),
    })
    .then(data => JSON.parse(data._bodyInit))
    .then(parsedData => console.warn(parsedData));
  }

  createOwnCalendar() {
    return fetch(`https://www.googleapis.com/calendar/v3/calendars/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.state.user.accessToken}`,
      },
      body: JSON.stringify({
        summary: 'Mis reservas de sala de Stastarat',
      }),
    })
    .then(data => JSON.parse(data._bodyInit))
    .then(parsedData => console.warn(parsedData));
  }

  googleAuth() {
    GoogleSignin.signIn()
      .then((user) => {
        this.setState({
          user,
        });
      })
      .catch((err) => {
        console.warn('WRONG SIGNIN', err);
      })
      .done();
  }


  /**
   * This func should:
   *   - login in the user
   *   - get the token
   *   - request a calendar with name 'Mis reservas de sala de Stastarat'
   *   - If found, save it to state, if not create one and save it
   * @return {Promise} [description]
   */
  async setupGoogleSignin() {
    try {
      await GoogleSignin.hasPlayServices({ autoResolve: true });
      await GoogleSignin.configure({
        scopes: ["https://www.googleapis.com/auth/calendar"],
        iosClientId: '295687312258-jds845jgdor7t2kqa9hcg3ucbp5u5ucg.apps.googleusercontent.com',
        webClientId: '295687312258-fqm02kbahoci2vsu98q2u0b9jfcoaf63.apps.googleusercontent.com',
        offlineAccess: false
      });

      const user = await GoogleSignin.currentUserAsync();
      this.setState({
        user,
      });
      console.log('user', user);
      const ownCalendar = await this.requestCal();
      console.log('ownCalendar', ownCalendar);
      if(ownCalendar){
        this.setState({
          calendar: ownCalendar,
        });
      }else{
        const newOwnCalendar = await this.createOwnCalendar();
        this.setState({
          calendar: newOwnCalendar,
        });
      }

    }
    catch (err) {
      console.warn("Google signin error", err.code, err.message);
    }
  }

  showDateTimePicker(startOrEnd) {
    this.setState({
      isDateTimePickerVisible: true,
      isSelectingStartOrEnd: startOrEnd,
    });
  }
  hideDateTimePicker() { this.setState({ isDateTimePickerVisible: false }); }
  handleDatePicked(date) {
    console.log(date);
    const startOrEnd = this.state.isSelectingStartOrEnd;
    this.setState({
      [`event${startOrEnd}`]: moment(date),
      // eventTime: moment(date)
    });
    this.hideDateTimePicker();
  };

  renderPrivateContent() {
    const start = this.state[`event${EVENT_START_STRING}`];
    const end = this.state[`event${EVENT_END_STRING}`];
    return (
      <View>
        <TouchableOpacity onPress={() => this.showDateTimePicker(EVENT_START_STRING)}>
          <Text>
            Hora de inicio{start && ':'}
          </Text>
          {start && <Text>{start.format('LLLL')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.showDateTimePicker(EVENT_END_STRING)}>
          <Text>
            Hora de finalización{end && ':'}
          </Text>
          {end && <Text>{end.format('LLLL')}</Text>}
        </TouchableOpacity>
        <TextInput placeholder="Nombre del evento" onChangeText={text => this.setState({ eventName: text })} />
        <TextInput placeholder="Descripcion" onChangeText={text => this.setState({ eventDesc: text })} />
        <DateTimePicker
          mode="datetime"
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this.handleDatePicked}
          onCancel={this.hideDateTimePicker}
        />
        <Text>{this.state.eventName}</Text>
        <Text>{this.state.eventDesc}</Text>
        <TouchableOpacity onPress={this.postEvent}><Text>Post event</Text></TouchableOpacity>
      </View>
    );
  }

  render() {
    return (
      <View>
        {/*}<TouchableOpacity onPress={this.fbAuth.bind(this)}>
          <Text>Login with Facebook</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={this.googleAuth.bind(this)}>
          <Text>
            {
              this.state.user
                ? 'User already logged in'
                : 'Login with Google'
            }
          </Text>
        </TouchableOpacity>
        {this.state.user ? this.renderPrivateContent() : null}
      </View>
    );
  }
}
