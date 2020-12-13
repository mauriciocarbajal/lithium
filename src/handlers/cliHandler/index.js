/**
 * This file contains the loop where lines are read from CLI
 * and the instrument is played
 * 
 * Some keypress events are mapped to chords, played by the instrument
 * which is included from "instrument"
 */

const readline = require('readline');
const { getNoteName } = require('./utils');
const { printScreen, clearScreen } = require('./asciiart');
const { mappings } = require('./mappings');


const {
  startInstrument,
  instrumentFeatures,
  instrumentFeatures: {
    getCurrentTonality,
    playChord,
    playSingleNote,
    releasePedal,
    sendControlChange,
    moveTonality,
  },
  closeInstrument, 
} = require('../../instrument');

const { CONTROL_VOLUME } = require('../../instrument/constants')

const { startLeap } = require('../leapHandler/index');
const { playModifiers } = require('../leapHandler/handlers');


// Initialize leap loop
let leapOn = false;
var myArgs = process.argv.slice(2);
if (myArgs && myArgs[0] === "leap") {
  console.log('Leap initialized...')
  startLeap(playModifiers(instrumentFeatures));
  leapOn = true;
}

// Initialize CLI interface
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

startInstrument();

let instrumentStatus = {
  key: getCurrentTonality(),
  grade: '?',
}

// Splash screen
clearScreen();
printScreen(instrumentStatus, "Boplicity", 3);

let pedal = false;

const keyHandler = (str, key) => {
  if (key.ctrl && key.name === 'c') {
    closeInstrument();
    process.exit();
  } else {
    const mappedThing = mappings(key);
    if (mappedThing.grade) {
      // CHORD
      const { grade, secDom, subMin } = mappedThing;
      const { label, gradeName } = playChord(grade, secDom, subMin);
      instrumentStatus = {
        key: getCurrentTonality(),
        grade: gradeName,
        secDom,
        subMin,
      }
      printScreen(instrumentStatus, label, subMin ? 1 : (secDom ? 2 : 0 ));
    } else if (mappedThing.note) {
      // NOTE
      const index = mappedThing.note;
      console.log(getNoteName(index-4));

      playSingleNote(index-4)
    } else if (mappedThing.semitone) {
      // TRANSPOSE
      moveTonality(mappedThing.semitone);
      instrumentStatus = {
        ...instrumentStatus,
        key: getCurrentTonality(),
      }
      printScreen(instrumentStatus, getCurrentTonality(), 3);
    } else if (mappedThing.release) {
      // RELEASE
      releasePedal();
      printScreen(instrumentStatus, "release", 3);
    } else if (mappedThing.pedal) {
      // PEDAL
      pedal = !pedal;
      printScreen(instrumentStatus, `Pedal ${pedal ? 'ON' : 'OFF'}`, 3);

    } else if (mappedThing.mute && leapOn) {
      // MUTE
      sendControlChange(0, CONTROL_VOLUME);
      printScreen(instrumentStatus, "mute", 3);
    }
  }
}

process.stdin.on('keypress', keyHandler);
