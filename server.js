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
 userId: ObjectId
 });



 const Log = mongoose.model('Log', {
   log: [String],
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

  var newLog = Log({
    log: [],
    date: new Date(),
    username: username
  });
  return newLog.save()
  .then(function(data){
    response.send(data);
})
.catch(function(err){
  console.log("CRAP", err.errors);
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
), foodfound];
})
.spread(function(update, foodfound){
    console.log("QUAN2", foodfound.quantity);
    if(foodfound.quantity <= 0) {
    //update the Log by "pulling" food from the log array
    return Log.update({_id: id},
      {$pull: {log: foodfound.foodname}})
    // .then(function(data){
    //   console.log("GONE!", data);
    //   return Food.remove({ _id: foodId });
    .then(function(){
      response.send("REMOVED");
    })
    .catch(function(err){
      console.log(err.errors);
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
  return [Log.findOne({_id: data.logId}), user]
})
  .spread(function(log, user){
//add foodname to log if it doesn't already exist. This must be done before creating
//or updating the food otherwise you'll always have a food to add to the log even if its a duplicate.
    if (log.log.indexOf(data.food.item_name) === -1) {
    log.log.push(data.food.item_name);
    return log.save();
  }


    return(user);
  })
  .then(function(user){
    //update the same information if its already there (so you don't create duplicates)
    //or create a new food item to be saved in the database
    return Food.update({
      foodname: data.food.item_name
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
      username: user.username
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
      return [Log.find({ _id: data.logId }), MySaved.find({username: data.username})]
      })
      .spread(function(log, mysaved){
        //need to grab the food from saved in Mysaved collection... then push it to log, then send the food
        console.log("YEEEHAWWWW!", mysaved[0].saved)

        //the saved array has objects but I just want to find the foodname that matches so I made a temp array
        //and push just the foodnames in them if they match


          var temp =[];

        mysaved[0].saved.forEach(function(object){
          console.log("YESSS",object.foodname);
          if (object.foodname === data.food) {
            temp.push(object.foodname);
          }
          console.log("RRRR", temp);
        });


        console.log("PLEASE WORK!", temp[0]);
        return [Food.find({foodname: temp[0]}), log];
      })
      .spread(function(food, log){
        //with the food object captured, I push it into the log array
        console.log("IT WILL BE OK", food)

        log[0].log.push(food[0]);
        return log[0].save();
      })
      .then(function(data){
        console.log("UMM", data)
        response.send(data);
      })
      .catch(function(err){
        console.log("NOOOO!!!", err.errors);
        response.send(err.message);
        console.log(err.stack);
      });
  });

app.post('/createsavedfood', function(request, response){
  var data = request.body;
  bluebird.all([User.findOne({username: data.username}), Log.findOne({_id: data.id}), MySaved.findOne({username: data.username})])
  .spread(function(user, log, saved){

    //add foodname to log(array) and saved(array) if it doesn't already exist. This must be done before creating the food otherwise you'll always have a food to add to the log even if its a duplicate.

    if (log.log.indexOf(data.food.foodname) === -1) {
    log.log.push(data.food.foodname);
    saved.saved.push(data.food.foodname);
    return [log.save(), saved.save()];
    }


    //most likely the food is being created for the first time but used upsert
    //incase user tries to make another food with the same name. The food will be updated
    //if it exist already or created if it doesnt exist yet
      return Food.update({
      foodname: data.food.foodname}, {

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
      username: data.username
    }}, {
      upsert: true
    }
    );

  })
  .then(function(){
    //why does adding a semicolon after the return statement pass a value of nothing??
    return Food.findOne({foodname:data.food.foodname})
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

app.get('/log/:id', function(request, response){
  var theId = request.params.id;
  console.log(theId);
  Log.findOne({
    _id: theId
  })
  .then(function(data){
    console.log("OMG WHY???", data.log);

      //filter through all foods in log

    return Food.find({
      foodname: {
      $in:
      data.log
    }
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


 app.listen(3000, function() {
   console.log('I am listening.');
 });
