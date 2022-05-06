import React  from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './firebase';
import { set, ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { Autocomplete, CardContent, getFabUtilityClass, Typography } from '@mui/material';
import { TextField } from '@mui/material';
import { getStorage, ref as stref, getDownloadURL } from "firebase/storage";
import { Grid } from '@mui/material';
import { Card } from '@mui/material';
import { Button } from '@mui/material';

function App() {
  const [todayFilmCast, setTodayFilmCast] = useState(Object)

  const [allTitles, setAllTitles] = useState([])
  const [allTitleIds, setAllTitleIds] = useState([])

  const [todayFilm, setTodayFilm] = useState("")

  const [imageUrl, setImageUrl] = useState(undefined);

  const [guesses, setGuesses] = useState([])
  const [actors, setActors] = useState([])
  const [directors, setDirectors] = useState([])

  const [gameWon, setGameWon] = useState([])

  // Download image from Firebase to display
  const downloadImage = (id, index) => {
    console.log("DOWNLOAD IMAGE CALLED")
    const storage = getStorage();
    var imageFilm = todayFilm
    if (id !== undefined) {
      imageFilm = id
    }
    console.log("Image Film: " + imageFilm)
    if (imageFilm.length > 0) {
      var picString = imageFilm + "/Still" + (index + 1) + '.jpeg'
      console.log("Pic String: " + picString)
      getDownloadURL(stref(storage, picString))
      .then((url) => {
        setImageUrl(url)
        console.log(url)
      })
      .catch((error) => {
        console.log("Error getting image")
      });
    }
  }

  // const getMatchingTitles = (text) => {
  //   const matches = []
  //   const matches_ids = []
  //   for (let i = 0; i < allTitles.length; i++) {
  //     const title = allTitles[i].toLowerCase()
  //     const id = allTitleIds[i]
  //     if (title.includes(text.toLowerCase())) {
  //       matches.push(allTitles[i])
  //       matches_ids.push(id)
  //     }
  //   }
  //   console.log("Matches")
  //   console.log(matches)
  //   console.log(matches_ids)
  // }

  // Load film for current day
  useEffect(() => {
    console.log("USE EFFECT CALLED")
    const curr_time = new Date().getTime()
    var date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit'}).format(curr_time)
    date = date.replace("/", "_")
    date = date.replace("/", "_")
    console.log(date)

    getTodayFilm(date)
    readAllTitles()
  }, [])

  // Loads the ID of today's film and loads the cast
  const getTodayFilm = (date) => {
    setTodayFilm("")
    onValue(ref(db, "Answers/" + date), snapshot => {
      const data = snapshot.val()
      if(data !== null) {
        const id = "" + data
        setTodayFilm(id)
        readCast(id, setTodayFilmCast, false)
        downloadImage(id, 0)
      }
    })
  }

  // Fetches all possible movie titles from Popular part of database
  const readAllTitles = () => {
    setAllTitles([])
    setAllTitleIds([])
    onValue(ref(db, "Popular"), snapshot => {
      const data = snapshot.val()
      if(data !== null) {
        const titles = []
        const ids = []
        for (const [key, value] of Object.entries(data)) {
          titles.push(value)
          ids.push(key)
        }
        setAllTitles(titles)
        setAllTitleIds(ids)
      }
    })
  }

  // Gets cast for specified film ID and loads it into either "todayFilmCast" or "guessFilmCast" using set_func
  const readCast = (film_id, set_func, compare) => {
    if (film_id.length > 6) {
      var film_ref = "Cast/" + film_id
      onValue(ref(db, film_ref), snapshot => {
        const data = snapshot.val()
        if(data !== null){
          console.log("Retrieved Cast:")
          console.log(data)
          if (set_func !== null) {
            set_func(data)
          }
          if (compare === true) {
            compareCast(data)
          }
        }
      })
    }
  }

  const compareCast = (guessCast) => {
    console.log("Compare")

    console.log(todayFilmCast["Actors"])
    console.log(guessCast["Actors"])
    console.log(todayFilmCast["Directors"])
    console.log(guessCast["Directors"])

    var actors1 = []
    var actors2 = []
    var directors1 = []
    var directors2 = []

    if (Object.keys(todayFilmCast).includes("Actors")) {
      console.log("Found Actors Key")
      actors1 = Object.keys(todayFilmCast["Actors"])
    }
    if (Object.keys(guessCast).includes("Actors")) {
      actors2 = Object.keys(guessCast["Actors"])
    }
    if (Object.keys(todayFilmCast).includes("Directors")) {
      directors1 = Object.keys(todayFilmCast["Directors"])
    }
    if (Object.keys(guessCast).includes("Directors")) {
      directors2 = Object.keys(guessCast["Directors"])
    }
    
    var actorString = ""
    for (const actor_id of actors1) {
      if (actors2.includes(actor_id) || directors2.includes(actor_id)) {
        console.log("Match")
        console.log(actor_id)
        console.log(todayFilmCast["Actors"][actor_id])
        if (actorString.length > 0) {
          actorString = actorString + ", " + todayFilmCast["Actors"][actor_id]
        }
        else {
          actorString = todayFilmCast["Actors"][actor_id]
        }
      }
    }

    var directorString = ""
    for (const director_id of directors1) {
      if (actors2.includes(director_id) || directors2.includes(director_id)) {
        console.log("Match")
        console.log(director_id)
        console.log(todayFilmCast["Directors"][director_id])
        if (directorString.length > 0) {
          directorString = directorString + ", " + todayFilmCast["Directors"][director_id]
        }
        else {
          directorString = todayFilmCast["Directors"][director_id]
        }
      }
    }

    if (actorString.length === 0) {
      actorString = "None"
    }
    if (directorString.length === 0) {
      directorString = "None"
    }

    console.log("Actor String: " + actorString)
    console.log("Director String: " + directorString)

    setActors([...actors, actorString])
    setDirectors([...directors, directorString])
  }

  const winGame = (film) => {
    setGuesses([...guesses, film])
    setGameWon([...gameWon, true])
  }

  // Get film ID corresponding to title selected and load it into guesses variable, also fetch the cast
  const getFilmInfo = (film) => {
    const index = allTitles.indexOf(film)
    if (index >= 0) {
      const id = allTitleIds[index]
      if (id === todayFilm) {
        console.log("You Win!")
        winGame(film)
      }
      else {
        setGameWon([...gameWon, false])
        readCast(id, null, true)
        downloadImage(todayFilm, guesses.length+1)
        setGuesses([...guesses, film])
      }
    }
  }

  const selectFilm = (film) => {
    getFilmInfo(film)
  }

  const FilmAutocomplete = () => {
    return (
      <div>
        <Card>
          <Autocomplete
            options={allTitles}
            clearOnEscape
            disabled={gameWon.includes(true)}
            renderInput={params => (
              <TextField {...params}  label="Film" variant="outlined" disabled={gameWon.includes(true)}/> 
            )}
            onChange={(_event, film) => {
              if (film !== null) {
                console.log(film)
                selectFilm(film)
              }
            }}
          />
        </Card>
        <div style={{height:"20px"}}></div>
      </div>
    );
  };

  const AnswerCard = (props) => {
    if (guesses.length <= props.id) {
      return (
        <div>
          <Card style={{backgroundColor:"gainsboro"}}>
            <CardContent>
              <Typography>
              </Typography>
            </CardContent>
          </Card>
          <div style={{height:"20px"}}></div>
        </div>
      )
    }

    const index = guesses.length - props.id - 1
    const film_title = guesses[index]
    console.log("Film Title: " + film_title)
    const won = gameWon[index]

    if (won === true) {
      return (
        <div>
        <Card style={{backgroundColor:"forestgreen"}}>
          <CardContent>
            <Typography variant="h6" component="div">
              {film_title}
            </Typography>
          </CardContent>
        </Card>
        <div style={{height:"20px"}}></div>
      </div>
      )
    }

    const actorString = actors[index]
    const directorString = directors[index]

    console.log("Actor String: " + actorString)
    console.log("Director String: " + directorString)
    var bgColor = "gainsboro"

    if (actorString === undefined && directorString === undefined) {
      console.log("Actor and director undefined")
    }
    else if (actorString !== "None" || directorString !== "None") {
      bgColor = "#f5cc6c"
      console.log(bgColor)
    }

    // var actorString = ""
    // if (props.actors.length > 0) {
    //   actorString = props.actors
    // }
    // else {
    //   actorString = "None"
    // }
    return (
      <div>
        <Card style={{backgroundColor:bgColor}}>
          <CardContent>
            <Typography variant="h6" component="div" align="left">
              {film_title}
            </Typography>
            <Typography variant="subtitle1" align="left"> 
              Shared Actors: {actorString}
            </Typography>
            <Typography variant="subtitle1" align="left"> 
              Shared Directors: {directorString}
            </Typography>
          </CardContent>
        </Card>
        <div style={{height:"20px"}}></div>
      </div>
    )
  }

  const imageButtonClicked = (index) => {
    downloadImage(todayFilm, index)
  }

  const ImageButton = (props) => {
    return (
      <Grid item xs={props.size}>
        <Button onClick={() => imageButtonClicked(props.id-1)}>
          {props.id}
        </Button>
      </Grid> 
    )
  }

  const AllImageButtons = () => {
    var totalButtons = [...guesses, todayFilm]
    console.log("Game Won From Button Function: " + gameWon)
    if (gameWon.includes(true)) {
      totalButtons = [0, 1, 2, 3, 4, 5]
    }
    // else if (totalButtons.length > 6) {
    //   totalButtons = [0, 1, 2, 3, 4, 5]
    // }
    console.log("Total Buttons: " + totalButtons)
    return totalButtons.map((_, index) => (
      <ImageButton key={index + gameWon} id={index+1} size={12.0/totalButtons.length}/>
  ))
  }

  return (
    <div className="App">
      
      <Grid container direction="column" >
        <Grid item> This is the header </Grid>
        <Grid item container>
          <Grid item xs={0.2}></Grid>
          <Grid item xs={11.6}>
            <img className='img_style' src={imageUrl} alt="Still from a movie"/>
          </Grid>
          <Grid item xs={0.2}></Grid>
        </Grid>
        <Grid item container>
          <Grid item xs={1} md={3}></Grid>
          <Grid item xs={10} md={6}>
            <Grid item container direction="column">
              <Grid item container direction="row">
                <AllImageButtons/>
              </Grid>
              <FilmAutocomplete/>
              <AnswerCard id={0}/>
              <AnswerCard id={1}/>
              <AnswerCard id={2}/>
              <AnswerCard id={3}/>
              <AnswerCard id={4}/>
              <AnswerCard id={5}/>
            </Grid>
          </Grid>
          <Grid item xs={1} md={3}></Grid>
        </Grid>
      </Grid>
      
      {/* <input type="text" value={val} onChange={handleValChange}/>
      <input type="text" value={val2} onChange={handleVal2Change}/>
      <button onClick={readAllTitles}>Submit</button>
      <button onClick={compareCast}>Compare</button>
      <button onClick={readAllCast}>Read Cast</button>
      {vals.map((val) => (
        <>
          <h1>{val}</h1>
          <button>update</button>
          <button>delete</button>
        </>
      ))} */}
    </div>
  );
}

export default App;
