/* eslint-disable react/jsx-filename-extension */
/* eslint-disable semi */
import React, { Component } from 'react'
import decode from 'jwt-decode'

import openSocket from 'socket.io-client'
import { Redirect } from 'react-router-dom'
import './NewGame.css'
import SetSelect from '../components/SetSelect'

const socket = openSocket('http://localhost:4000')
// const socket = openSocket('https://pixelsagainstpeople.herokuapp.com/')

// import GameScreen from './GameScreen'

class NewGame extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSets: ['Base'],
      cardSets: [],
      lobbyId: '',
      lobbyName: '',
      user: '',
      AIName: '',
      AI: [],
    }
  }

  componentWillMount() {
    fetch('https://cards-against-humanity-api.herokuapp.com/sets')
      .then(response => response.json())
      .then((sets) => {
        this.setState({ cardSets: sets })
      }).catch(err => console.log(err.message))
    this.handleAI()
    this.handleLobby()
  }

  handleLobby() {
    socket.on("Lobby Created", (lobbyId) => {
      console.log(lobbyId)
      this.setState({ lobbyId })
    })
  }

  handleAI() {
    socket.on("Add AI", (user) => {
      let AI = this.state.AI
      AI.push(user)
      this.setState({ AI })
    })
  }

  createAI(e, name) {
    e.preventDefault()
    if(name.length >= 1){
      socket.emit('Create AI', name)
      this.setState({ AIName: '' })
    }
  }

  highlightSet(setName) {
    // adds selected set to state if not already included, removes if it is already included
    const selected = this.state.selectedSets
    if (selected.includes(setName)) {
      selected.splice(selected.indexOf(setName), 1)
      this.setState({ selectedSets: selected })
    } else {
      selected.push(setName)
      this.setState({ selectedSets: selected })
    }
  }

  // eslint-disable-next-line class-methods-use-this
  createLobby(e, strId) {
    e.preventDefault()
    fetch((`https://cards-against-humanity-api.herokuapp.com/sets/multi?sets=${this.state.selectedSets}`))
      .then(res => res.json())
      .then(res => {
        socket.emit('Create Lobby', res, strId, decode(localStorage.getItem('cahToken'))._id, this.state.AI)
      })
  }

  renderSets(sets) {
    // maps setnames to elements based on whether or not they are in the selectedsets states
    return sets.map((set) => {
      const output = (this.state.selectedSets.includes(set.setName)
        ? <SetSelect onClick={() => this.highlightSet(set.setName)} key={set.setName} setName={set.setName} highlight="highlighted" />
        : <SetSelect onClick={() => this.highlightSet(set.setName)} key={set.setName} setName={set.setName} highlight="unhighlighted" />)
      return output
    })
  }

  render() {
    let redirect = true
    if (localStorage.getItem('cahToken')) {
      redirect = false
    }
    return (
      <div className="newGameContainer">
        {redirect && <Redirect to="/login" />}}
        {this.state.lobbyId && <Redirect to={'/play-game/' + this.state.lobbyId} />}
        <div className="playersContainer">
          <h1>Current Players</h1>
          <div className="player">
            <img align="middle" src="http://images.panda.org/assets/images/pages/welcome/orangutan_1600x1000_279157.jpg" alt="placeholder" />
            <span>Jack</span>
          </div>
        </div>
        <div className="setContainer">
          <h1>Select The Decks You'd Like to Use</h1>
          {this.renderSets(this.state.cardSets)}
        </div>
        <div className="startButton">
          <form className="startForm">
            <input type="text" placeholder="Lobby Name" value={this.state.lobbyName} onChange={e => this.setState({ lobbyName: e.target.value })} />
            <button type="submit" onClick={e => this.createLobby(e, this.state.lobbyName)}>Start</button>
          </form>
          <form className="startForm">
            <input type="text" placeholder="Bot Name" value={this.state.AIName} onChange={e => this.setState({ AIName: e.target.value })} />
            <button type="submit" onClick={e => this.createAI(e, this.state.AIName)}>Add Bot</button>
          </form>
          
        </div>
      </div>
    )
  }
}

export default NewGame
