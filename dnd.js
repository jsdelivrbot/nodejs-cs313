const express = require('express')
var session = require('express-session');
const http = require("http");
const fs = require("fs");

// used for uploading images
// const multer = require('multer')

// const upload = multer({
    // dest: "/public/images/"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
//   });

var app = express();
app.use(session({secret: 'secretpassword'}));
var session;

const path = require('path');

// to send posts
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// Require my custom config file
var config = require('./config');

// Set up port to listen on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Require 'pg' to connect to database
const { Pool } = require('pg');

// Get the connection string from environment variables, if not, then grab it from my local config file.
connectionString = process.env.DATABASE_URL || config.connectionString;

// Create our pool for connections
const pool = new Pool({connectionString: connectionString});

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Root will redirect to login page
app.get('/', (req, res) => res.redirect('/login'));

app.get("/image.png", (req, res) => {
    res.sendFile(path.join(__dirname, "./images/image.png"));
  });

const handleError = (err, res) => {
res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong! ERR:" + err);
};

// Used for file uploads - install this package express-fileupload - it made this really easy :D
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// app.post('/uploadcharacterimg', function(req, res) {
//     console.log("files " + req.files.characterpic)
//     console.log("files " + req.file)
//     if (!req.files)
//       return res.status(400).send('No files were uploaded.');
   
//     // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
//     let characterpic = req.files.characterpic;
//     console.log("character pic" + characterpic)
//     console.log("characterpic filename" + characterpic.name)

//     // Use the mv() method to place the file somewhere on your server - I prefer to use the full path
//     characterpic.mv('/app/public/images/' + characterpic.name, function(err) {
//       if (err)
//         return res.status(500).send(err);
   
//       res.status(200).json({"success": "File " + characterpic.name + " was uploaded successfully"});
//     });
//   });

  /***************************************************
 *  addCharacter - adds a character to the database 
 * *************************************************/
app.post('/addCharacter', function (req, res) {
    var characterName = req.body.avatarname;
    let characterpic = req.files.characterpic;
    var username = session.username;
    console.log("adding character under username: " + username)

    console.log("Name of character to be put into the database: " + characterName)
    console.log("files to be uploaded " + req.files.characterpic)
    console.log("name of file" + req.files.characterpic.name)

    imgPath = "images/" + characterpic.name
    // grab username from the session (easier than passing it with the query strings)
    addCharacterdb(characterName, imgPath, username, function (err, result) {
        characterpic.mv('/app/public/images/' + characterpic.name, function(err) {
            if (err)
              return res.status(500).send("Problem uploading image " + err);
          });

        if (err) {
            res.status(500).send("Character couldn't be put into database");
        } 
        else if (!req.files) {
            res.status(500).send("No files were sent to server");
            
        } else {
            res.redirect('/selectionpage');
            
            // res.status(200).json({"success": "File " + characterpic.name + " was uploaded successfully", "result" : result});
        }
    });
  
});

function addCharacterdb(characterName, imgPath, username, callback) {

    // Get the correct userid
    var sql ="SELECT id from users where username = $1::text";

    var params = [username];

    pool.query(sql, params, function(err, result) {
        if (err) {
            console.log("Couldn't get the correct userID");
            callback("failed to get correct userid " + err, null);

            // If we were able to find the correct username and ID, then 
        } else {
            var userid = result.rows[0].id;
            console.log("Got the correct userID: " + userid);
            // console.log("userid to insert" + result.rows[0].id);
            /****************************************************************************
            * Execute another sql statement to insert the character to the database 
            *****************************************************************************/
            var sql = "INSERT into characters (avatarname, posx, posy, imgpath, userid, gameid) VALUES ($1::text, $2::int, $3::int, $4::text, $5::int, $6::int);"
            var params = [characterName, 0, 0, imgPath, userid, 0];
    
            pool.query(sql, params, function(err, result) {
                if (err) {
                    console.log("Failed to add Character to db;");
                    callback("failed to add character to database " + err, null);
                } else {
                    console.log("added character to database");
                    callback(null, result.rows);
                }
            });
        }
    });
}


/***************************************************
 *  addGame - adds a character to the database 
 * *************************************************/
app.post('/addGame', function (req, res) {
    var gamename = req.body.gamename;
    let tablepic = req.files.tablepic;
    var username = session.username;

    console.log("Name of game to be put into the database: " + gamename)
    console.log("files to be uploaded " + req.files.tablepic)
    console.log("name of file" + req.files.tablepic.name)


    imgPath = "images/" + tablepic.name
    // grab username from the session (easier than passing it with the query strings)
    addGamedb(gamename, imgPath, username, function (err, result) {
        tablepic.mv('/app/public/images/' + tablepic.name, function(err) {
            if (err)
              return res.status(500).send("Problem uploading image " + err);
          });

        if (err) {
            res.status(500).send("game couldn't be put into database");
        } 
        else if (!req.files) {
            res.status(500).send("No files were sent to server");
            
        } else {
            res.render('pages/selectionpage');
            // res.status(200).json({"success": "File " + characterpic.name + " was uploaded successfully", "result" : result});
        }
    });
  
});

function addGamedb(gamename, imgPath, username, callback) {

    // Get the correct userid
    var sql ="SELECT id from users where username = $1::text";

    var params = [username];

    pool.query(sql, params, function(err, result) {
        if (err) {
            console.log("Couldn't get the correct userID");
            callback("failed to get correct userid " + err, null);

            // If we were able to find the correct username and ID, then 
        } else {
            console.log("Got the correct userID");
            var userid = result.rows[0].id;
            console.log("userid to insert" + result.rows.id);
            /****************************************************************************
            * Execute another sql statement to insert the game to the database 
            *****************************************************************************/
            var sql = "INSERT into games (gamename, tableimgpath) VALUES ($1::text, $2::text);"
            var params = [gamename, imgPath];
    
            pool.query(sql, params, function(err, result) {
                if (err) {
                    console.log("Failed to add game to db;");
                    callback("failed to add game to database " + err, null);
                } else {
                    console.log("added game to database");
                    callback(null, result.rows);
                }
            });
        }
    });
}
// app.post(
//     "/uploadcharacterimg",upload.single("characterpic" /* name attribute of <file> element in your form */),
//     (req, res) => {
//       console.log("Got to post message to uploadcharacter image");
//       console.log("body characterpic: " + req.body.imgPath);
//       console.log("body: " + JSON.stringify(req.body));

//     //   console.log("req.file: " + req.file.path)
//     //   console.log("path: " + req.body.characterpic.path);
//       const tempPath = req.body.imgPath;
//       const targetPath = path.join(__dirname, "./public/images/" + req.body.imgPath);
//         console.log("originalS name: " + req.body.imgPath);
//       if (path.extname(req.body.imgPath).toLowerCase() === ".png" || path.extname(req.body.imgPath).toLowerCase() === ".jpg") {
//         fs.rename(tempPath, targetPath, err => {
//           if (err) return handleError(err, res);
  
//           ress
//             .status(200)
//             .contentType("text/plain")
//             .end("File uploaded!");
//         });
//       } else {
//         fs.unlink(tempPath, err => {
//           if (err) return handleError(err, res);
  
//           res
//             .status(403)
//             .contentType("text/plain")
//             .end("Only .png files are allowed!");
//         });
//       }
//     }
//   );

// When user selects start game
app.get('/enterGame', function(req, res) {
    // var username = session.username;

    var gamename = req.query.gamename;
    console.log("gamename I am looking for: " + gamename)

    var sql = "SELECT * from games where gamename = $1::text;";
    var params = [gamename];

    pool.query(sql, params, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.render('pages/game', {"data" : result.rows});
            // res.status(200).json(result.rows);
        }
    })
});

app.get('/getcharactername', function(req, res) {
    var username = session.username;
    var gameid = req.query.gameid
    console.log("The username is " + username)
    console.log("The gameid is " + gameid)

    var sql = "select * from users where username = $1::text"
    var params = [username]

    pool.query(sql, params, function(err, result) {
        if (err) {
            res.status(500).json({"error" : "we couldn't get your userID" + err});
        } else {

            // for (var i = 0; i < result.rows.length; i++) {
            console.log("the result of the first userid query is " + result.rows[0].id);

            // }
            var sql = "Select avatarname from characters where userid = $1::int and gameid = $2::int"
            var params = [result.rows[0].id, gameid]
 
            pool.query(sql, params, function(err, result) {
                if (err) {
                    res.status(500).json({"error": "couldn't get charactername" + err})
                } else {
                    res.status(200).json({"avatarname": result.rows[0].avatarname})
                }
            })
            // res.status(200).json({"userid" : result.id})
        }
    });
});

// if GET method on login, display login page
app.route('/login')
    .get(function(req, res) {
        // must set session variable ONCE, might as well do it at root.
        session = req.session;
        res.render('pages/login');
    })
    .post(function(req, res) {
        // username and password from /login.ejs form
        var username = req.body.username;
        var password = req.body.password;

        var sql = "SELECT * from users;";
        params = [];

        pool.query(sql, params, function(err, result) {
            if (err) {
                console.log('couldnt connect to database to list users to log into');
                res.status(500).json(err);
            } else {
                for (var i = 0; i < result.rows.length; i++) {
                    if (result.rows[i].username == username && result.rows[i].password == password) {
                        // If user was successfully authenticated, then lets make them a session.
                        session.username = username;
                        session.password = password;

                        app.use(function(req, res, next) {
                            res.locals.username = req.session.username;
                            next();
                          });

                        console.log("session username: " + session.username);
                        console.log("session password: " + session.password);

                        // successful login!
                        res.status(200).json({'success' : 'Login Successful'});
                    }
                }
            }
        });

        console.log("Username: " + username);
        console.log("password: " + password);
    
    });

    

app.route('/selectionpage')
    .get(function(req, res) {
        res.render('pages/selectionpage');
    });
    

/* getCharacters - returns json list of all characters belong to that user */
app.get('/getCharacters', function(req, res) {
    var username = session.username;
    console.log("got the username from the session variable: " + username);
    // Get the correct userid
    var sql ="SELECT id from users where username = $1::text";

    var params = [username];

    pool.query(sql, params, function(err, result) {
        if (err) {
            console.log("Couldn't get the correct userID");
            res.status(500).send(err);

            // If we were able to find the correct username and ID, then 
        } else {
            console.log("Got the correct userID");
            // var userid = result.rows.id;
            var userid = result.rows[0].id;

            console.log("rows that we got back: " + JSON.stringify(result));
            console.log("the userID is: " + userid);
            var sql = "SELECT * from characters where userid = $1::int;";
            var params = [userid];

            pool.query(sql, params, function(err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).json(result.rows);
                }
            });
        }
    });
});

/* getGames - returns json list of all games -> used so user can pick which one to join */
app.get('/getGames', function(req, res) {

    var sql = "SELECT * from games;";
    var params = [];

    pool.query(sql, params, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).json(result.rows);
        }
    })
});

/* getGames - returns json list of all games -> used so user can pick which one to join */
app.get('/setCharacterGameid', function(req, res) {
    var avatarname = req.query.charactername;
    var gameid = req.query.gameid;
    console.log("name = " + avatarname)
    console.log("gameid = " + gameid)

    var sql = "Update characters set gameid = $1::int where avatarname = $2::text";
    var params = [gameid, avatarname];
 
    pool.query(sql, params, function(err, result) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.status(200).json({success: "Successfully updated the database"});
        }
    })
});


/* *********************************************************
 * getDMs - returns json list of all dms belong to that user 
 * *********************************************************/
app.get('/getDMs', function(req, res) {
    var username = session.username;
    console.log("got the username from the session variable: " + username);
    // Get the correct userid
    var sql ="SELECT id from users where username = $1::text";

    var params = [username];

    pool.query(sql, params, function(err, result) {
        if (err) {
            console.log("Couldn't get the correct userID");
            res.status(500).send(err);

            // If we were able to find the correct username and ID, then 
        } else {
            // var userid = result.rows.id;
            var userid = result.rows[0].id;
            console.log("Got the correct userID: " + userid);


            var sql = "SELECT * from dm where userid = $1::int;";
            var params = [userid];

            pool.query(sql, params, function(err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).json(result.rows);
                }
            
            });
        }
    });
});

/* getNPCs - returns json list of all dms belonging to that user */
app.get('/getNPCs', function(req, res) {
    var dmid = req.query.dmid;

    var sql = "SELECT * from NPC where dmid = $1::int;";
    var params = [dmid];  

    pool.query(sql, params, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).json(result.rows);
        }
    })
});


/* changeMap - changes the currently displayed map */
    app.get('/changeMap', function(req, res) {
        // Grab the input from the query string
        var newtableImgPath = req.query.tableImgPath;
        var gameid = req.query.gameid;

        // create a function with a callback, which will be invoked when the database is finished
        changeMapdb(newtableImgPath, gameid, function (err, result) {
            if (err) {
                // If an error was returned from the db, send back an
                // internal server error 500 and the error.
                res.status(500).send(err);
            } else {
                // If it worked, send a 200: OK and the result
                res.status(200).json({success: 200, result: result});
            }
        });
    });

    // execute the database query, calling back to our /changeMap endpoint
    function changeMapdb (newtableImgPath, gameid, callback) {

        // sql query
        var sql = "UPDATE games set tableimgpath = $1::text where id = $2::int";

        // load prepared statement with proper variables
        var params = [newtableImgPath, gameid];

        // execute the query with our pool
        pool.query(sql, params, function(err, result) {
                if (err) {
                    // if database returns an error, pass it to the callback
                    callback("failed to change map: " + err);
                } else {
                    // if successful, error = null, pass back success message
                    callback(null, "Map changed successfully");
                }
        });
    }


/* addNPC - adds a new NPC */
app.get('/addNPC', function(req, res) {
    // grab the username and password (password better be encrypted)
    npcname = req.query.npcname;
    dmid = req.query.dmid;
    npcimgpath = req.query.npcimgpath;

    // created sql statement and assign parameters
    var sql = "INSERT INTO NPC (npcname, dmid, npcimagepath) VALUES ($1::text, $2::int, $3::text)";
    var params = [npcname, dmid, npcimgpath];
    
    // execute the query
    pool.query(sql,params, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else (
            res.status(200).send("Successfully added NPC: " + npcname)
        )
    });
});

/* addDM - adds a new user */
app.get('/addDM', function(req, res) {
    console.log("called /addDM");
    // grab the username and password (password better be encrypted)
    dmname = req.query.dmName;
    // userid = req.query.userid;
    var username = session.username;
    // Get the correct userid
    var sql ="SELECT id from users where username = $1::text";

    var params = [username];

    pool.query(sql, params, function(err, result) {
        if (err) {
            console.log("Couldn't get the correct userID");
            callback("failed to get correct userid " + err, null);

            // If we were able to find the correct username and ID, then 
        } else {
            var userid = result.rows[0].id;
            console.log("Got the correct userID");
            console.log("userid to insert" + result.rows[0].id);

            // created sql statement and assign parameters
            var sql = "INSERT INTO dm (dmname, userid) VALUES ($1::text, $2::int)";
            var params = [dmname, userid];
            
            // execute the query
            pool.query(sql,params, function(err, result) {
                if (err) {
                    res.status(500).send(err);
                } else (
                    res.render('pages/selectionpage')
                    // res.status(200).send("Successfully added dm" + dmname + " to the database")
                )
            });
        }
    });
});

/* addUser - adds a new user (uses post method because we don't want to expose password in the query string)*/
app.post('/addUser', function(req, res) {
    // grab the username and password (password better be encrypted)
    username = req.body.username;
    password = req.body.password;

    // created sql statement and assign parameters
    var sql = "INSERT INTO users (username, password) VALUES ($1::text, $2::text)";
    var params = [username, password];
    
    // execute the query
    pool.query(sql,params, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else (
            res.status(200).send("Successfully added user" + username + " to the database")
        )
    });
});




/* /getGameCharacters – gets all the characters that have enrolled in this game. (via session variable or another table?) */
    app.get('/getGameCharacters', function (req, res) {
        var gameid = req.query.gameid;

        console.log("getGameCharacters called correctly :D");
        getGameCharactersdb(gameid, function(err, result) {
            console.log("got row with gameid:" + gameid)
            console.log("Got this result back from the database: " + result);
            res.json(result)
        });
    })

    function getGameCharactersdb(gameid, callback) {
        var sql = "SELECT * from characters where gameid = $1::int;";
        var params = [gameid];

        pool.query(sql, params, function (err, result) {
            if (err) {
                console.log("could't get game characters from database");
                console.log(err);
            } else {
                console.log("The result was: " + JSON.stringify(result.rows));
                callback(null, result.rows)
            }
        });
    } 
        
app.get('/move', function(req, res) {
    var characterName = req.query.characterName;
    var posy = req.query.posy;
    var posx = req.query.posx;
    console.log("characterName" + characterName);
    console.log("posx" + posx);
    console.log("posy" + posy);

    moveCharacter (characterName, posx, posy, function (err, result) {
        if (err) {
            res.status(500).send("Database failed: " + err);
        } else {
            res.status(200).send(result);
        }
    });
});

function moveCharacter(characterName, posx, posy, callback) {
    var sql = "UPDATE characters set posx = $1::int, posy = $2::int where avatarname = $3::text";
    var params = [posx, posy, characterName];

    pool.query(sql, params, function(err, result) {
        if (err) {
            callback(err, null);
        } else (
            callback(null, characterName + ' position updated successfully')
        )
    });
}

