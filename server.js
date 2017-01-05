const mongoose = require('mongoose');
const bluebird = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const uuidV1 = require('uuid/v1');

app.use(express.static('public/templates'));
app.use(bodyParser.json());
mongoose.Promise = bluebird;
const ObjectId = mongoose.Schema.ObjectId;

mongoose.connect('mongodb://localhost/foodlog_db');

var randomToken = uuidV1();

const User = mongoose.model('User', {
  username: { type: String, required: true },
  password: { type: String, required: true },
  token: String,
  date: Date
});

const Food = mongoose.model('Food', {
  foodname: { type: String, required: true },
  quantity: Number,
  calories: Number,
  totalFat: Number,
  saturatedFat: Number,
  cholesterol: Number,
  sodium: Number,
  carbohydrates: Number,
  fiber: Number,
  sugars: Number,
  protein: Number,
  username: String,
  date: Date,
  userId: ObjectId
});



const Log = mongoose.model('Log', {
  log: [{foodname: String, date: Date},],
  date: Date,
  username: String
});


const MySaved = mongoose.model('MySaved', {
  saved: [String],
  username: String
});

// var newsaved = new MySaved({
//   saved: [],
//   username: "Dom"
// });
// newsaved.save()
app.post('/signup', function(request, response){
var userdata = request.body;
console.log(userdata);
  if(userdata.password === userdata.password2) {
    bcrypt.genSalt(10)
    .then(function(salt){
      return bcrypt.hash(request.body.password, salt);
    })
    .then(function(encryptedpass) {
      console.log(encryptedpass);
      var newUser = new User({
        username: userdata.username,
        password: encryptedpass
      });
      return newUser.save();

    })
    .then(function(){
      var newsaved = new MySaved({
        saved: [],
        username: userdata.username
      });
      newsaved.save();
    })
    .then(function(){
      response.send("Success!");
    })
    .catch(function(err){
      console.log("AHHHH",  err.stack);
    });
  }
  else{
    response.status(400);
    response.json("passwords don't match");
  }
 });

 app.post('/login', function(request, response) {
   var userdata = request.body;
   console.log("XXXXXXXXXX", userdata);
   User.findOne({ username: userdata.username})
   .then(function(user){
     console.log(userdata.password);
     console.log(user.password);
     return [user, bcrypt.compare(userdata.password, user.password)];
         //bcrypt.compare === true or false
   })
   .spread(function(user, boolean) {
     if (boolean === true) {
       console.log("Login Success");
       user.token = randomToken;
       return user.save();
     }
     else {
       console.log("Login Failed");
       response.status(401);
       response.send('Login Failed');
     }
   })
   .then(function(user) {
     if (response.headersSent) {
       return;
     }
     response.send(user);
   })
   .catch(function(err){
     console.log('OMG ERROR: ', err.message);

   });
 });


 function auth(request, response, next) {
   //verify auth token
   var token = request.query.token;
   User.findOne({token: token})
   .then(function(user){
     console.log("k", token);
     console.log("k2", user.token);
     console.log('k3', user);
     if(user.token === token) {

       next();
     } else {
       response.status(401);
       response.json({error: "you are not logged in"});
     }


 });
 }

 app.use(auth);

app.get('/alllogs', function(request, response){
  var username = request.query.username;
  Log.find({username: username})
  .then(function(data){
    response.send(data);
  });
});

app.post('/delete', function(request, response){
  var id = request.body.id;
  console.log("HERES THE ID", id);
  return Log.remove({_id: id})
  .then(function(){
    Log.find({_id: id});
  })
  .then(function(data){
    console.log("YOOOOO", data);
    response.send("success");
  })
  .catch(function(err){
    console.log(err.errors);
  });
});

app.get('/createlog', function(request, response){
  var username = request.query.username;
  var today = new Date().toDateString();
  console.log(" do I get here?");
  Log.find({username: username})
.then(function(log){
  console.log(log);

  log.forEach(function(object){
    if (object.date.toDateString() === today){
      console.log("BBB", object.date.toDateString())
      console.log("BBB", today)
      response.send("You already created a log for" + today + "!");
        return;
    }
  });
  if (response.headersSent) {
    return;
  }
  var newLog = Log({
    log: [],
    date: new Date(),
    username: username
  });
  return newLog.save();
})
  .then(function(data){

    response.send(data);
  })
  .catch(function(err){
    console.log("CRAP", err.errors);
    console.log("CRAP", err.stack);
  });
});
app.post('/deletesavedfoods', function(request, response){
  var foodname = request.body.foodname;
  var username = request.body.username;
  MySaved.findOne({username: username})
  .then(function(saved){
    console.log(saved._id)
    return MySaved.update({_id: saved._id},
      {$pull: {saved: foodname}});
  })
  .then(function(updated){
    response.send(updated);
  })
  .catch(function(err){
    console.log(err.errors);
  });

});

app.post('/delfoods', function(request, response){
  var id = request.body.id;
  var food = request.body.food;
  var foodId = request.body.food_id;
  console.log("YEAH FOOD", food);
  console.log("YEAH FoodID", foodId);
  Food.findOne({_id: foodId})
  .then(function(foodfound){
    console.log("MYFOOD", foodfound);
    console.log("QUAN", foodfound.quantity);
    return [Food.update({_id: foodfound._id},{
      $inc: {quantity: -1}}
    ), foodfound, Log.findOne({_id: id})];
  })
  .spread(function(update, foodfound, log){

    console.log("QUAN2", foodfound.quantity);
    if(foodfound.quantity <= 1) {

      log.log.forEach(function(object){
        console.log(object);
        console.log(foodfound.foodname);
        if (object.foodname === foodfound.foodname){
          bluebird.all([Log.update({_id: id},
            {$pull: {log: {foodname: object.foodname} }}), log])
            .spread(function(doc, log){
              console.log("am I here", log.date);
              return Food.remove({_id: foodId});
            })
            .then(function(removed){
              response.send("REMOVED");
            })
            .catch(function(err){
              console.log(err);
            });
        }
      });
      }
      else{
        response.send("quantity - 1");
      }
    })
    .catch(function(err){
      console.log(err.errors);
    });

  });


app.post('/foodToDatabase', function(request, response) {
  var data = request.body;
  console.log("Here! OK", data.logId);
  User.findOne({username: data.username})
  .then(function(user){
    console.log(data.username);
    return [Log.findOne({_id: data.logId}), user];
  })
  .spread(function(log, user){
    console.log("TTT", data.food);
    //add foodname to log if it doesn't already exist. This must be done before creating
    //or updating the food otherwise you'll always have a food to add to the log even if its a duplicate.
    console.log("WILL THIS WORK?", log.date.toDateString());
      var matches;
    log.log.forEach(function(object){
      console.log(object.foodname, "Space", data.food.item_name);
      console.log(object.date.toDateString(), "Space", log.date);
      if(object.foodname === data.food.item_name && object.date.toDateString() === log.date.toDateString()){
        matches = true;
      }
    });
      if(!matches){
        console.log("HEREEEE");

      log.log.push({foodname: data.food.item_name, date: log.date});
      console.log(log.log);
      return [log.save()];
    }
  })
  .then(function(){
    //had to find log again because it didnt like when I used spread after putting an object in an array
    return [Log.findOne({_id: data.logId}), data.username];
  })
  .spread(function(log, user){
    //update the same information if its already there (so you don't create duplicates)
    //or create a new food item to be saved in the database
    return Food.update({
      foodname: data.food.item_name,
      date: log.date
    }, {
      $inc: {quantity: 1},
      $set: {

        foodname: data.food.item_name,
        calories: data.food.nf_calories,
        totalFat: data.food.nf_total_fat,
        saturatedFat: data.food.nf_saturated_fat,
        cholesterol: data.food.nf_cholesterol,
        sodium: data.food.nf_sodium,
        carbohydrates: data.food.nf_total_carbohydrate,
        fiber: data.food.nf_dietary_fiber,
        sugars: data.food.nf_sugars,
        protein: data.food.nf_protein,
        username: user,
        date: log.date
      }
    }, {
      upsert: true
    });
  })
  .then(function(){

    response.send("done");
  })
  .catch(function(err){
    console.log("NOOOO!!!", err.errors);
    response.send(err.message);
    console.log(err.stack);
  });
});

app.post('/submitsavedfoods', function(request, response){
  var data = request.body;
  console.log("999", data.food)
  User.findOne({username: data.username})
  .then(function(user){
    return [Log.findOne({ _id: data.logId }), MySaved.findOne({username: data.username})]
  })
  .spread(function(log, mysaved){
    //need to grab the food from saved in Mysaved collection... then push it to log, then send the food
    console.log("YEEEHAWWWW!", mysaved.saved)

    //the saved array has objects but I just want to find the foodname that matches so I made a temp array
    //and push just the foodnames in them if they match


    var temp =[];

    mysaved.saved.forEach(function(object){
      console.log("YESSS", object);
      if (object === data.food) {
        temp.push(object);
      }
      console.log("RRRR", temp);
    });


    console.log("PLEASE WORK!", temp[0]);
    return [Food.findOne({foodname: temp[0]}), log];
  })
  .spread(function(food, log){
    anotherTemp = [];
    log.log.forEach(function(object){
      anotherTemp.push(object.foodname);
    });
    console.log("IT WILL BE OK", food);
    if(food === null){
      response.status(400);
      return;
    }
    else if (anotherTemp.indexOf(food.foodname) === -1) {
      console.log("ALMOST", log.log);
      log.log.push({foodname: food.foodname, date: log.date});
      console.log("ALMOST DONE", log.log);
      bluebird.all([log.save(), food, log])
      .spread(function(logsaved, food, log){
        console.log("u");
        var newFood = new Food({
          foodname: food.foodname,
          quantity: 1,
          calories: food.calories,
          totalFat: food.totalFat,
          saturatedFat: food.saturatedFat,
          cholesterol: food.cholesterol,
          sodium: food.sodium,
          carbohydrates: food.carbohydrates,
          fiber: food.fiber,
          sugars: data.food.nf_sugars,
          protein: food.protein,
          date: log.date,
          username: data.username
        });
        return newFood.save();
      })
      .then(function(food){
        response.send(food);
      })
      .catch(function(err){
        console.log("oh NOO!!!", err.errors);
        response.send(err.message);
        console.log(err.stack);
      });

    }
    else{
      bluebird.all([log, food])
      .spread(function(log, food){
        console.log('u2')
        return Food.update({foodname: food.foodname, date: log.date},
          {
            $inc: {quantity: 1}
          });
        })
        .then(function(updated){
          console.log("UMM", updated);
          response.send(updated);
        })
        .catch(function(err){
          console.log("NOOOO!!!", err.errors);
          response.send(err.message);
          console.log(err.stack);
        });

    }
});
  });

app.post('/createsavedfood', function(request, response){
  var data = request.body;
  bluebird.all([User.findOne({username: data.username}), Log.findOne({_id: data.id}), MySaved.findOne({username: data.username})])
  .spread(function(user, log, saved){

    //add foodname to log(array) and saved(array) if it doesn't already exist. This must be done before creating the food otherwise you'll always have a food to add to the log even if its a duplicate.

    var matches;
  log.log.forEach(function(object){
    console.log(object.foodname, "Spacedout", data.food.foodname);
    console.log(object.date.toDateString(), "Spacedout", log.date);
    if(object.foodname === data.food.foodname && object.date.toDateString() === log.date.toDateString()){
      matches = true;
    }
  });
    if(!matches){
      console.log("OK HEREEEE");

    log.log.push({foodname: data.food.foodname, date: log.date});
    console.log(log.log);
    return [log.save()];
  }
    //saved needs to happen independent of log
  });
  return MySaved.findOne({username: data.username})
  .then(function(saved){
    if (saved.saved.indexOf(data.food.foodname) === -1) {
      saved.saved.push(data.food.foodname);
      return saved.save();
    }

    var x = null;
    return x;
  })
  .then(function(saved){
    //finding log so that the date always matches the food for that log
    return Log.findOne({_id: data.id});
  })
  .then(function(log){
    //most likely the food is being created for the first time but used upsert
    //incase user tries to make another food with the same name and date. The food will be updated
    //if it exist already or created if it doesnt exist yet

    console.log("@@@", log.date);
    return Food.update({
      foodname: data.food.foodname, date: log.date}, {
        $set: {
          foodname: data.food.foodname,
          quantity: data.food.quantity,
          calories: data.food.calories,
          totalFat: data.food.total_fat,
          saturatedFat: data.food.saturated_fat,
          cholesterol: data.food.cholesterol,
          sodium: data.food.sodium,
          carbohydrates: data.food.carbohydrates,
          fiber: data.food.fiber,
          sugars: data.food.sugars,
          protein: data.food.protein,
          username: data.username,
          date: log.date
        }}, {
          upsert: true
        }
      );
    })
    .then(function(updated){
      return Log.findOne({_id: data.id});
    })
    .then(function(log){
      return Food.findOne({foodname:data.food.foodname, date: log.date});
    })
    .then(function(food){
      response.send(food);
    })
    .catch(function(err){
      console.log("OH NOOOO!!!", err.errors);
      console.log(err.stack);
      response.send(err.message);
    });
  });

app.get('/allsaved', function(request, response){
  var username = request.query.username;
  console.log("YOOOOO", username)
  MySaved.findOne({username: username})
  .then(function(saved){
    response.send(saved);
  })
  .catch(function(err){
    console.log(err.stack);
  });

});

app.get('/log/:id', function(request, response){
  var theId = request.params.id;
  console.log(theId);
  Log.findOne({
    _id: theId
  })
  .then(function(data){
    var temp = [];
    data.log.forEach(function(object){
      temp.push(object.foodname);
    });
    console.log("OMG WHY???", temp);

    //filter through all foods in log

    return Food.find({
      foodname: {
        $in:
        temp
      }, date: data.date
    });
  })
  .then(function(foods){
    console.log("hello", foods)
    response.send(foods);
  })
  .catch(function(err){
    console.log("NOOOO!!!", err.errors);
  });
});


app.listen(5000, function() {
  console.log('I am listening.');
});
