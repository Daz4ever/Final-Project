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

app.post('/foodToDatabase', function(request, response) {
  var data = request.body;
  console.log("Here!", data.logId);
  User.findOne({username: data.username})
  .then(function(user){
  console.log(data.username);
  return user;
  })
  .then(function(user){
    var newFood = new Food({
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
    });

    return newFood.save();

  })
  .then(function(food){
    return [Log.find({ _id: data.logId }), food];
  })
  .spread(function(log, food){
    console.log("LOG", log);
    console.log("FOOD", food);
    console.log(log[0].log);
    log[0].log.push(food.foodname);
    return log[0].save()
  })
  .then(function(data){
    response.send(data);
  })
  .catch(function(err){
    console.log("NOOOO!!!", err.errors);
  });
  });

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
