import React  from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './firebase';
import { set, ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { Autocomplete, Box, CardContent, getFabUtilityClass, Typography } from '@mui/material';
import { TextField } from '@mui/material';
import { getStorage, ref as stref, getDownloadURL } from "firebase/storage";
import { Grid } from '@mui/material';
import { Card } from '@mui/material';
import { Button } from '@mui/material';
import { Dialog, DialogTitle } from '@mui/material';
import { IconButton } from '@mui/material';
import { Close, Info, Share } from '@mui/icons-material';
import { PropTypes } from 'prop-types'
import { styled } from '@mui/material';
import { DialogContent } from '@mui/material';
import { DialogActions } from '@mui/material';
import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material';
import copy from 'copy-to-clipboard';


function App() {
  const [todayFilmCast, setTodayFilmCast] = useState(Object)

  const [allTitles, setAllTitles] = useState([])
  const [allTitleIds, setAllTitleIds] = useState([])

  const [todayFilm, setTodayFilm] = useState("")
  const [todayFilmTitle, setTodayFilmTitle] = useState("")

  const [imageUrl, setImageUrl] = useState(undefined);

  const [guesses, setGuesses] = useState([])
  const [actors, setActors] = useState([])
  const [directors, setDirectors] = useState([])

  const [gameWon, setGameWon] = useState([])
  const [gameOver, setGameOver] = useState(false)

  const [openDialog, setOpenDialog] = useState(false)
  const [openInfoDialog, setOpenInfoDialog] = useState(false)

  const [todayDate, setTodayDate] = useState("")

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleClickOpenInfo = () => {
    setOpenInfoDialog(true)
  }

  const handleInfoClose = () => {
    setOpenInfoDialog(false)
  }

  const myTheme = createTheme({
    overrides: {
      Button: {
        raisedPrimary: {
          color: "#222222"
        }
      }
    },
    palette: {
      primary: {
        main: '#444444',
      },
      secondary: {
        main: "#ffffff"
      }
    },
  });

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

    setTodayDate(date)
    const lastPlayedDate = localStorage.getItem("lastGame")
    if (lastPlayedDate === date) {
      //Load existing user guesses
      getUserGuesses()
    }
    else {
      localStorage.setItem("lastGame", date)
      localStorage.setItem("guesses", JSON.stringify([]))
      localStorage.setItem("actors", JSON.stringify([]))
      localStorage.setItem("directors", JSON.stringify([]))
      localStorage.setItem("gameWon", JSON.stringify([]))
    }
    readAllTitles(date)
    readStats()
    //getTodayFilm(date)

  }, [])

  const saveUserState = (todayGuesses, todayActors, todayDirectors, todayGameWon) => {
    localStorage.setItem("guesses", JSON.stringify(todayGuesses))
    localStorage.setItem("actors", JSON.stringify(todayActors))
    localStorage.setItem("directors", JSON.stringify(todayDirectors))
    localStorage.setItem("gameWon", JSON.stringify(todayGameWon))
  }

  const getUserGuesses = () => {
    var todayGuesses = localStorage.getItem("guesses")
    var todayActors = localStorage.getItem("actors")
    var todayDirectors = localStorage.getItem("directors")
    var todayGameWon = localStorage.getItem("gameWon")

    if (todayGuesses !== null) {
      todayGuesses = JSON.parse(todayGuesses)
    }
    else {
      todayGuesses = []
    }
    if (todayActors !== null) {
      todayActors = JSON.parse(todayActors)
    }
    else {
      todayActors = []
    }
    if (todayDirectors !== null) {
      todayDirectors = JSON.parse(todayDirectors)
    }
    else {
      todayDirectors = []
    }
    if (todayGameWon !== null) {
      todayGameWon = JSON.parse(todayGameWon)
    }

    console.log("Today Guesses")
    console.log(todayGuesses)

    setGuesses(todayGuesses)
    setActors(todayActors)
    setDirectors(todayDirectors)
    setGameWon(todayGameWon)

    if (todayGameWon.includes(true) || todayGuesses.length >= 6) {
      setGameOver(true)
      setOpenDialog(true)
    }
  }

  const newStats = () => {
    const filmle_stats = {
      averageGuesses: 0,
      currentStreak: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      guesses: {
        "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "fail": 0
      },
      maxStreak: 0,
      winPercentage: 0
    }

    return filmle_stats
  }

  const readStats = () => {
    var stats = JSON.parse(localStorage.getItem("filmle-stats"))
    if (stats === null) {
      stats = newStats()
    } 
    console.log("Filmle stats: ")
    console.log(stats)
    return stats
  }

  const checkWonYesterday = () => {
    const today = new Date()
    var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    yesterday = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit'}).format(yesterday)
    yesterday = yesterday.replace("/", "_")
    yesterday = yesterday.replace("/", "_")
    
    const lastWin = localStorage.getItem("lastWin")

    if (lastWin === yesterday) {
      return true
    }
    return false
  }
  
  const updateStats = (todayGameWon) => {
    var stats = readStats()

    const averageGuesses = stats["averageGuesses"]
    const gamesPlayed = stats["gamesPlayed"]
    const allGamesWon = stats["gamesWon"]
    if (todayGameWon.includes(true)) {
      const newAverageGuesses = (averageGuesses*allGamesWon+todayGameWon.length)/(allGamesWon+1)
      stats["averageGuesses"] = newAverageGuesses
      stats["gamesWon"] = allGamesWon + 1
      stats["guesses"]["" + todayGameWon.length] = stats["guesses"]["" + todayGameWon.length] + 1

      const wonYesterday = checkWonYesterday()
      if (wonYesterday === true) {
        stats["currentStreak"] = stats["currentStreak"] + 1
        if (stats["currentStreak"] > stats["maxStreak"]) {
          stats["maxStreak"] = stats["currentStreak"]
        }
      }
      else {
        stats["currentStreak"] = 1
        stats["maxStreak"] = 1
      }
      localStorage.setItem("lastWin", todayDate)
    }
    else {
      stats["guesses"]["fail"] = stats["guesses"]["fail"] + 1
      stats["currentStreak"] = 0
    }
    stats["gamesPlayed"] = gamesPlayed + 1
    stats["winPercentage"] = stats["gamesWon"] / stats["gamesPlayed"]

    console.log("New Stats")
    console.log(stats)

    localStorage.setItem("filmle-stats", JSON.stringify(stats))
  }

  // Loads the ID of today's film and loads the cast
  const getTodayFilm = (date, titles, ids) => {
    setTodayFilm("")
    onValue(ref(db, "Answers/" + date), snapshot => {
      const data = snapshot.val()
      if(data !== null) {
        const id = "" + data
        setTodayFilm(id)
        readCast(id, setTodayFilmCast, false)
        downloadImage(id, 0)

        // Get title
        if (ids.indexOf(id) >= 0) {
          const filmTitle = titles[ids.indexOf(id)]
          setTodayFilmTitle(filmTitle)
        }
      }
    })
  }

  // Fetches all possible movie titles from Popular part of database
  const readAllTitles = (date) => {
    setAllTitles([])
    setAllTitleIds([])
    onValue(ref(db, "Popular"), snapshot => {
      const data = snapshot.val()
      if(data !== null) {
        const titlesAndIds = []
        
        for (const [key, value] of Object.entries(data)) {
          titlesAndIds.push({title: value, id: key})
          //titles.push(value)
          //ids.push(key)
        }

        titlesAndIds.sort((a, b) => a.title.localeCompare(b.title))
        const titles = []
        const ids = []
        for (let i = 0; i<titlesAndIds.length; i++) {
          titles.push(titlesAndIds[i].title)
          ids.push(titlesAndIds[i].id)
        }
        setAllTitles(titles)
        setAllTitleIds(ids)
        getTodayFilm(date, titles, ids)
      }
    })
  }

  // Gets cast for specified film ID and loads it into either "todayFilmCast" or "guessFilmCast" using set_func
  const readCast = (film_id, set_func, compare, guesses) => {
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
            compareCast(data, guesses)
          }
        }
      })
    }
  }

  const compareCast = (guessCast, guesses) => {
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

    saveUserState(guesses, [...actors, actorString], [...directors, directorString], [...gameWon, false])
  }

  const winGame = (film) => {
    setGameOver(true)
    saveUserState([...guesses, film], actors, directors, [...gameWon, true])
    setGuesses([...guesses, film])
    updateStats([...gameWon, true])
    setGameWon([...gameWon, true])
    setOpenDialog(true)
  }

  // Get film ID corresponding to title selected and load it into guesses variable, also fetch the cast
  const getFilmInfo = (film) => {
    const index = allTitles.indexOf(film)
    if (index >= 0) {
      const id = allTitleIds[index]
      const finishGame = guesses.length >= 5
      if (id === todayFilm) {
        console.log("You Win!")
        winGame(film)
      }
      else {
        setGameWon([...gameWon, false])
        readCast(id, null, true, [...guesses, film])
        downloadImage(todayFilm, guesses.length+1)
        setGuesses([...guesses, film])

        if (finishGame) {
          setGameOver(true)
          setOpenDialog(true)
        }
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
            disabled={gameOver}
            renderInput={params => (
              <TextField {...params}  label="Film" variant="outlined" disabled={gameOver}/> 
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
          <Card style={{backgroundColor:"#010202"}}>
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
        <ThemeProvider theme={myTheme}>
          <Button style={{minWidth:"20px"}} onClick={() => imageButtonClicked(props.id-1)} variant="contained" color="primary">
            {props.id}
          </Button>
        </ThemeProvider>
      </Grid> 
    )
  }

  const AllImageButtons = () => {
    var totalButtons = [...guesses, todayFilm]
    console.log("Game Won From Button Function: " + gameWon)
    if (gameWon.includes(true) || gameOver) {
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

  const printResult = () => {
    var gameWonIndex = gameWon.indexOf(true)
    console.log("Game Won Index: " + gameWonIndex)

    const guessCount = gameWon.length
    const remainCount = 6-guessCount

    var outputString = "Filmle\n\n"
    for (let i = 0; i < guessCount; i++) {
      if (i === gameWonIndex) {
        outputString = outputString + "🟩"
      }
      else if (actors[i] === "None" && directors[i] === "None") {
        outputString = outputString + "⬛"
      }
      else {
        outputString = outputString + "🟨"
      }
    }

    for (let i = 0; i < remainCount; i++) {
      outputString = outputString + "⬜️"
    }

    outputString = outputString + "\n\nhttps://www.filmle.org"
    copy(outputString)
    alert("Copied to clipboard")
    //alert("Navigator Share: " + navigator.share)
    // navigator.clipboard.writeText(outputString)
    // console.log("Game Output String " + outputString)
    // try {
    //   navigator.share({outputString})
    //   alert("Shared")
    // }
    // catch {
    //     navigator.clipboard.writeText(outputString).then(() => {
    //       alert("Copied to clipboard")
    //     })
    //     .catch(() => {
    //       alert("Couldn't copy to clipboard")
    //     })
    // }
   
    // alert(navigator.share)
    // if (navigator.canShare !== undefined) {
    //   navigator.share(outputString)
    // }
    // else {
    //   navigator.clipboard.writeText(outputString)
    // }

    console.log(outputString)
  }

  async function CheckPermission(){
    const readPerm = await navigator.permissions.query({name: 'clipboard-read', allowWithoutGesture: false });
    
    const writePerm = await navigator.permissions.query({name: 'clipboard-write', allowWithoutGesture: false });
    
    // Will be 'granted', 'denied' or 'prompt':
    alert('Write: '+writePerm.state);
  }

  const BootstrapDialogTitle = (props) => {
    var { children, onClose, ...other } = props;
    var title = "Next Time!"
    if (gameWon.includes(true)) {
      title = "Great Job!"
    }
    if (props.info === true) {
      title = "Info"
    }
  
    return (
      <DialogTitle sx={{ m: 0, p: 2 }} {...other} align="center">
        {title}
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        ) : null}
      </DialogTitle>
    );
  };  

  BootstrapDialogTitle.propTypes = {
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
  };
  
  const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

  const ShareDialog = () => {
    const stats = readStats()
    const played = stats["gamesPlayed"]
    const winPerc = Math.round(stats["winPercentage"]*100)
    const currStreak = stats["currentStreak"]
    const maxStreak = stats["maxStreak"]

    return (
      <BootstrapDialog
        onClose={handleClose}
        //aria-labelledby="customized-dialog-title"
        open={openDialog}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
          Title Goes Here
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Today's Film: {todayFilmTitle}
          </Typography>
          <Box display="flex" flexDirection="row" align="center" alignItems="top" justifyContent="center">
            <Box display="flex" flexDirection="column">
              <Typography variant="h5" align="center">{played}</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Played</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h3">&nbsp;</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h5" align="center">{winPerc}%</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Win %</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h3">&nbsp;</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h5" align="center">{currStreak}</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Current</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Streak</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h3">&nbsp;</Typography>
            </Box>
            <Box display="flex" flexDirection="column">
              <Typography variant="h5" align="center">{maxStreak}</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Max</Typography>
              <Typography variant="subtitle2" align="center" fontSize="10px">Streak</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions align="center">
          <div style={{flex: '1 0 0'}} />
          <Button variant="contained" color="success" onClick={() => printResult()}><b>Share &nbsp;</b> <Share/></Button>
          <div style={{flex: '1 0 0'}} />
        </DialogActions>
      </BootstrapDialog>
    )
  }

  const InfoDialog = () => {
    return (
      <BootstrapDialog
        onClose={handleInfoClose}
        //aria-labelledby="customized-dialog-title"
        open={openInfoDialog}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleInfoClose} info={true}>
          Title Goes Here
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Guess the film using the stills provided before they run out! Each still is slightly easier than the previous one, and all 
            stills (6 total) are from the same movie. If your guess is incorrect but shares actors or directors with the film of the day,
            you'll be informed which cast members are shared. 
          </Typography>
        </DialogContent>
        <DialogContent align="center">
          <Typography gutterBottom>
            Movies pulled from IMDB datasets and some shots sourced from <a href="https://www.shotdeck.com">ShotDeck.com</a>
          </Typography>
        </DialogContent>
        <DialogContent dividers justify="center" align="center">
          <Typography gutterBottom>
            Like Filmle? <a href="https://www.buymeacoffee.com/filmlegame">Buy me a coffee!</a>
          </Typography>
        </DialogContent>
      </BootstrapDialog>
    )
  }

  return (
    <div className="App">
      <ShareDialog/>
      <InfoDialog/>

      <Grid container direction="column" >
        <Grid item container direction="row" >
          <Grid item xs={1}>
          </Grid>
          <Grid item xs={10}> 
            <Typography color="white" component={'span'}>
              <h1 className='font-title2'>
                <b>FILMLE</b>
              </h1>
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Box style={{height:"100%"}} display="flex" flexDirection="row" align="center" alignItems="center" justifyContent="center" m={0}>
              <ThemeProvider theme={myTheme}>
                <IconButton aria-label="info" color="secondary" onClick={() => handleClickOpenInfo()}>
                  <Info/>
                </IconButton>
              </ThemeProvider>
            </Box>
          </Grid>
        </Grid>
        
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
              <div style={{height:"5px"}}></div>
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
