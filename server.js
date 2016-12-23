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
 quantity: String,
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
  console.log("YEAH FOOD", food);
  console.log("YEAH ID", id);
  //update the Log by "pulling" food from the log array
  Log.update({_id: id},
    {$pull: {log: food}})
  .then(function(data){
    console.log("GONE!", data);
    response.send(data);
  })
  .catch(function(err){
    console.log(err.errors);
  });
});

app.post('/foodToDatabase', function(request, response) {
  var data = request.body;
  console.log("Here!", data.logId);
  User.findOne({username: data.username})
  .then(function(user){
  console.log(data.username);
  return user;
  })
  .then(function(user){
    //update the same information if its already there (so you don't create duplicates)
    //or create a new food item to be saved in the database
    return Food.update({
      foodname: data.food.item_name,
      username: user.username
    }, {
      $set: {
      foodname: data.food.item_name,
      quantity: data.food.nf_serving_size_qty,
      calories: data.food.nf_calories,
      totalFat: data.food.nf_total_fat,
      saturatedFat: data.food.nf_saturated_fat,
      cholesterol: data.food.nf_cholesterol,
      sodium: data.food.nf_sodium,
      carbohydrates: data.food.nf_total_carbohydrate,
      fiber: data.food.nf_dietary_fiber,
      sugars: data.food.nf_sugars,
      protein: data.food.nf_protein,
      username: user.username,
    }
    }, {
      upsert: true
    });

  })
  .then(function(){
    return [Log.find({ _id: data.logId }), Food.find({foodname: data.food.item_name, username: data.username})];
  })
  .spread(function(log, food){
    console.log("LOG", log);
    console.log("FOOD", food);
    console.log(log[0].log);
    log[0].log.push(food[0].foodname);
    console.log(log[0].log);
    return log[0].save()
  })
  .then(function(data){
    response.send(data);
  })
  .catch(function(err){
    console.log("NOOOO!!!", err.errors);
    response.send(err.message);
    console.log(err.stack);
  });
  });

// app.post('/submitsavedfoods', function(request, response){
//   var data = request.body;
//   User.findOne({username: data.username})
//   .then(function(user){
//     return Food.update({
//       foodname: data.foodname2.item_name,
//       username: user.username
//     }, {
//       $set: {
//       foodname: data.foodname2.myfood,
//       quantity: data.foodname2.quantity,
//       calories: data.foodname2.calories,
//       totalFat: data.foodname2.total_fat,
//       saturatedFat: data.foodname2.saturated_fat,
//       cholesterol: data.foodname2.cholesterol,
//       sodium: data.foodname2.sodium,
//       carbohydrates: data.foodname2.carbohydrates,
//       fiber: data.foodname2.fiber,
//       sugars: data.foodname2.sugars,
//       protein: data.foodname2.protein,
//       username: user.username,
//     }
//     }, {
//       upsert: true
//     })
//     .then(function(){
//       return [Log.find({ _id: data.logId }), Food.find({foodname: data.foodname2.myfood, username: data.username})];
//       })
//       .spread(function(log, food){
//         log[0].log.push(food[0].foodname2);
//         return log[0].save();
//       })
//       .then(function(data){
//         response.send(data);
//       })
//       .catch(function(err){
//         console.log("NOOOO!!!", err.errors);
//         response.send(err.message);
//         console.log(err.stack);
//       });
//   });
//
// });
app.get('/log/:id', function(request, response){
  var theId = request.params.id;
  console.log(theId);
  Log.find({
    _id: theId
  })
  .then(function(data){
    console.log("OMG WHY???", data);
    //filter through all foods
      //finds all foodnames in array log within data(specific log collection from id)
      // Food.find({}).then(function(foods){
      //   console.log(foods);
      // });
      console.log(data[0].log)
    return Food.find({
      foodname: {
      $in:
      data[0].log
    }
    });
    })
    .then(function(foods){
      console.log("hello", foods[0])
        response.send(foods);
    })
    .catch(function(err){
      console.log("NOOOO!!!", err.errors);
});
});


 app.listen(3000, function() {
   console.log('I am listening.');
 });
