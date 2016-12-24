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
   log: [{_id: mongoose.Schema.Types.ObjectId, foodname: String}],
   date: Date,
   username: String
 });


 const MySaved = mongoose.model('MySaved', {
   saved: [{_id: mongoose.Schema.Types.ObjectId, foodname: String}],
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
  //update the Log by "pulling" food from the log array
  Log.update({_id: id},
    {$pull: {log: {_id: foodId}}})
  .then(function(data){
    console.log("GONE!", data);
    return Food.remove({ _id: foodId });
  })
  .then(function(){
    response.send("REMOVED");
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
    var newfood = new Food({

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
    return newfood.save();
  })
  .then(function(food){
    return [Log.find({ _id: data.logId }), food];
  })
  .spread(function(log, food){
    console.log("LOG", log);
    console.log("FOOD", food);
    console.log(log[0].log);
    log[0].log.push(food);
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
        var temp = [];

        mysaved[0].saved.forEach(function(object){
          console.log("YESSS",object.foodname);
          temp.push(object.foodname);
          console.log("RRRR", temp);
        });
          var foodmatches = [];
        temp.forEach(function(foodname){
          if(foodname === data.food){
            foodmatches.push(foodname);
          }

        });
        console.log("PLEASE WORK!", foodmatches);
        console.log("PLEASE WORK!", foodmatches[0]);
        return [Food.find({foodname: foodmatches[0]}), log];
      })
      .spread(function(food, log){
        log[0].log.push(food.foodname2);
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
  User.findOne({username: data.username})
  .then(function(user){
    //most likely the food is being created for the first time but used upsert
    //incase user tries to make another food with the same name. The food will be updated
    //if it exist already or created if it doesnt exist yet
    var newfood = new Food({

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
    });

    return newfood.save();
  })
  .then(function(food){
    //why does adding a semicolon after the return statement pass a value of nothing??
    return [MySaved.find({username: data.username}), Log.find({_id: data.id}), food]
  })
  .spread(function(savedfoods, log, food){
    console.log("BOOM2", savedfoods);
    savedfoods[0].saved.push(food);
    console.log("BOOM2", savedfoods[0].saved);
    console.log("BOOM", log[0]);
    log[0].log.push(food);
    console.log("BOOM3", log[0].log);
    return [savedfoods[0].save(), log[0].save()];
  })
  .spread(function(savedfoods, log){
    return Food.find({foodname: data.food.foodname});
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
  Log.find({
    _id: theId
  })
  .then(function(data){
    console.log("OMG WHY???", data);


      // });
      console.log("888", data[0].log);
      //pushing all objects in a temp array to just grab the foodname to use in the food.find()
      var temp = [];

      data[0].log.forEach(function(object){
        temp.push([object.foodname]);
      });
      console.log("777", temp);
      //filter through all foods
        //finds all foodnames in array temp
    return Food.find({
      foodname: {
      $in:
      temp
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
