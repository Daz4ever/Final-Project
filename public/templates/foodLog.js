var app = angular.module('foodlog',['ui.router', 'ngAnimate', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider){
  $stateProvider

  .state({
    name: 'frontpage',
    url: '/',
    templateUrl: 'frontpage.html',
    controller: 'frontpageController'
  })
  .state({
    name: 'alllogs',
    url: '/alllogs',
    templateUrl: 'allLogs.html',
    controller: 'alllogsController'
  })
  .state({
    name: 'log',
    url: '/log/{logId}',
    templateUrl: 'log.html',
    controller: 'logController'
  })
  .state({
    name: 'customfoods',
    url: '/customfoods',
    templateUrl: 'customfoods.html',
    controller: 'customfoodsController'
  })
  .state({
    name: 'signup',
    url: '/signup',
    templateUrl: 'signup.html',
    controller: 'signupController'
  })
  .state({
    name: 'login',
    url: '/login',
    templateUrl: 'login.html',
    controller: 'loginController'
  });
  $urlRouterProvider.otherwise('/');
});

app.factory('foodlog', function factory($http, $rootScope, $cookies) {
  var service = {};
  // var appId ='63be4ab8'
  // var API_KEY = '060f94e8ed4e0561c70e4651b4983d87'


  $rootScope.cookieData = null;
  $rootScope.cookieData = $cookies.getObject('cookieData');
  console.log("Printing initial cookie", $rootScope.cookieData);

  if ($rootScope.cookieData) {
  $rootScope.auth = $rootScope.cookieData.token;
  console.log($rootScope.auth)
    console.log($rootScope.token)
  $rootScope.username = $rootScope.cookieData.username;
  }

  $rootScope.logout = function(){
    $cookies.remove('cookieData');
    $rootScope.cookieData = null;
    $rootScope.username = null;
    $rootScope.auth = null;
  };


  service.signup = function(userinfo) {
    return $http ({
      method: 'POST',
      url: '/signup',
      data: userinfo
    });
  };

  service.login = function(userdata) {
    return $http ({
      method: 'POST',
      url: '/login',
      data: userdata
    });
  };

  service.alllogs = function(){
    return $http ({
      method: 'GET',
      url: '/alllogs',
      params: {username: $rootScope.username, token: $rootScope.auth}

    });
  };

  service.createlog = function() {
    return $http ({
      method: 'GET',
      url: '/createlog',
      params: {username: $rootScope.username, token: $rootScope.auth}
    });
  };

  service.del = function(id){
    return $http ({
      method: 'POST',
      url: '/delete',
      data: {id: id, username: $rootScope.username},
      params: {token: $rootScope.auth}
    });
  };

  service.delfoods = function(id, food, food_id){
    return $http ({
      method: "POST",
      url: '/delfoods',
      data: {
        id: id,
        food: food,
        food_id: food_id,
        username: $rootScope.username
      },
      params: {token: $rootScope.auth}
    });
  };
  service.deletesavedfoods = function(food){
    return $http ({
      method: "POST",
      url: '/deletesavedfoods',
      data: {
        foodname: food,
        username: $rootScope.username
      },
      params: {token: $rootScope.auth}
    });
  };
  service.allsaved = function(){
    return $http ({
      method: 'GET',
      url: '/allsaved',
      params: {username: $rootScope.username, token: $rootScope.auth}
    });
  };

  service.foodListInLog = function(id){
    return $http ({
      method: 'GET',
      url: '/log/' + id,
      params: {username: $rootScope.username, token: $rootScope.auth}
    });
  };

  service.searchBigData = function(foodname){
    var url = "https://api.nutritionix.com/v1_1/search/" + foodname + "?results=0%3A20&cal_min=0&cal_max=50000&fields=item_name%2Cnf_calories%2Cnf_total_fat%2Cnf_saturated_fat%2Cnf_cholesterol%2Cnf_sodium%2Cnf_total_carbohydrate%2Cnf_dietary_fiber%2Cnf_sugars%2Cnf_protein&appId=63be4ab8&appKey=060f94e8ed4e0561c70e4651b4983d87";
    return $http ({
      method: 'GET',
      url: url
    });
  };
  service.bigDataToMyDataBase = function(data){
    return $http ({
      method: 'POST',
      url: '/foodToDatabase',
      data: data,
      params: {token: $rootScope.auth}
    });
  };
  service.submitsavedfoods = function(data){
    return $http ({
      method: 'POST',
      url: '/submitsavedfoods',
      data: data,
      params: {token: $rootScope.auth}
    });
  };
  service.createsavedfood = function(data){
    return $http ({
      method: 'POST',
      url: '/createsavedfood',
      data: data,
      params: {token: $rootScope.auth}
    });
  };
  return service;
});


app.controller('frontpageController', function($scope, foodlog, $state){

});

app.controller('signupController', function($scope, foodlog, $state){
  $scope.signUp = function() {

    var userinfo = {
      username: $scope.username,
      password: $scope.password,
      password2: $scope.password2
    };
    foodlog.signup(userinfo)
    .success(function(data) {
      console.log("YAY", data);
      $state.go('login');
    })
    .error(function(data){
      console.log("failed");
      $scope.failedPassMatch = true;
    });
  };


});

app.controller('loginController', function($scope, foodlog, $state, $cookies, $rootScope) {

$scope.login = function(){
  loginInfo = {
    username: $scope.username,
    password: $scope.password
  };

  foodlog.login(loginInfo)
  .error(function(data){
    console.log("failed");
    $scope.loginfailed = true;
  })
  .success(function(data){
    console.log(data);
    $cookies.putObject('cookieData', data);
    console.log("ADDED COOKIE");
    $rootScope.username = data.username;
    console.log('Hello', $rootScope.username);

    $state.go('alllogs');
  });
};
$scope.loginfailed = false;
});

app.controller('alllogsController', function($scope, $state, foodlog) {

  var alllogs = function() {
    foodlog.alllogs()
    .success(function(data){
      console.log(data);
      $scope.logs = data;
    })
    .error(function(data){
      console.log("failed");
    });
  };
  alllogs();

  $scope.deleteLogPage = function(id) {
    foodlog.del(id)
    .success(function(data){
      console.log(data);
      $state.reload();
    })
    .error(function(data){
      console.log("failed");
    });
  };

  $scope.createLog = function(){
    foodlog.createlog()
    .success(function(data){
      console.log("888", data);
      $scope.today = new Date().toDateString();
      if (data === "You already created a log for" + $scope.today + "!"){
        $scope.failed = true;
        //used timeout so flash statement disappears after user re-enters in input bar
        setTimeout(function(){$scope.failed = false}, 1000);
        setTimeout(function(){alllogs();}, 2500);
      }else {
        $state.go('log', {logId: data._id });
      }


    })
    .error(function(data){
      console.log("I'm over here, failed");
    });
  };
});

app.controller('customfoodsController', function($scope, foodlog){

  var customReload = function(){

    foodlog.allsaved()
    .success(function(data){
      console.log(data);
      $scope.saved = data;
    }).
    error(function(data){
      console.log("failed");
    });
  };
  customReload();

  $scope.deleteSavedFoods = function(food){

    foodlog.deletesavedfoods(food)
    .success(function(data){
      console.log(data);
      customReload();
    })
    .error(function(data){
      console.log("failed");
    });
  };
});


app.controller('logController', function($scope, foodlog, $state, $stateParams, $rootScope) {
  $scope.logId = $stateParams.logId;
  console.log($scope.logId);



  var generateAllFoods = function(){
    foodlog.foodListInLog($scope.logId)
    .success(function(data){
      console.log("WHAT?", data);
      $scope.food = data;

      var sumQty = 0;
      var sumCal = 0;
      var sumTFat = 0;
      var sumFat = 0;
      var sumCho = 0;
      var sumSo = 0;
      var sumCarb = 0;
      var sumFi = 0;
      var sumSug = 0;
      var sumPro = 0;

      //Totaling up all the food variables for the food logs

      data.forEach(function(food){
        if(food.quantity){
          sumQty += food.quantity;
        }
        if(food.calories){
          sumCal += (food.calories * food.quantity);
        }
        if(food.totalFat){
          sumTFat += (food.totalFat * food.quantity);
        }
        if(food.saturatedFat){
          sumFat += (food.saturatedFat * food.quantity);
        }
        if(food.cholesterol){
          sumCho += (food.cholesterol * food.quantity);
        }
        if(food.sodium){
          sumSo += (food.sodium * food.quantity);
        }
        if(food.carbohydrates){
          sumCarb += (food.carbohydrates * food.quantity);
        }
        if(food.fiber){
          sumFi += (food.fiber * food.quantity);
        }
        if(food.sugars){
          sumSug += (food.sugars * food.quantity);
        }
        if(food.protein){
          sumPro += (food.protein * food.quantity);
        }

      });
      $scope.sumCal = sumCal;
      $scope.sumQty = sumQty;
      $scope.sumTFat = sumTFat;
      $scope.sumFat = sumFat;
      $scope.sumCho = sumCho;
      $scope.sumSo = sumSo;
      $scope.sumCarb = sumCarb;
      $scope.sumFi = sumFi;
      $scope.sumSug = sumSug;
      $scope.sumPro = sumPro;

      //clearing all of the input boxes after refresh
      $scope.foodname2 = "";
      $scope.foodname = "";

      $scope.myfood = "";
      $scope.quantity ="";
      $scope.calories = "";
      $scope.total_fat = "";
      $scope.saturated_fat = "";
      $scope.cholesterol = "";
      $scope.sodium = "";
      $scope.carbohydrates = "";
      $scope.fiber = "";
      $scope.sugars = "";
      $scope.protein = "";
    })
    .error(function(data){
      console.log("failed");
    });
  };

  generateAllFoods();

  $scope.custom = function(){
    $state.go('customfoods');
  };

  $scope.deleteFoods = function(food, food_id){
    foodlog.delfoods($scope.logId, food, food_id)
    .success(function(data){
      console.log(data);
      generateAllFoods();
    })
    .error(function(data){
      console.log("failed");
    });
  };

  var foodname = null;
  var foodname2 = null;

  $scope.submitbut = true;

  $scope.submitFood =function(){
    $scope.submitbut = false;
    foodname = $scope.foodname;
    console.log("BAH", foodname);
    if(foodname === undefined) {

      //used timeout so flash statement disappears after user re-enters in input bar
      setTimeout(function(){$scope.enteredNada = false}, 2000);
    }
    else{

      foodlog.searchBigData(foodname)
      .success(function(data){

        $scope.fooditem = data.hits[0].fields;
        var foodmany = data.hits.slice(0, 10);

        var temporary = [];
        foodmany.forEach(function(object){
          temporary.push(object.fields);
        });
        $scope.foodsmany = temporary
        console.log("111", temporary);
        $scope.foodoptions = true;

      })
        .error(function(data){
          console.log("failed");
        });
    }
  };


$scope.toDataBase = function(){
  $scope.submitbut = true;
  $scope.foodoptions = false;
  $scope.foody.item_name = $scope.foody.item_name.toLowerCase()
    .split(' ').map(function(word) {
        return word[0].toUpperCase() + word.substr(1);
    }).join(' ');
  var data = {
    username: $rootScope.username,
    food: $scope.foody,
    fooddate: $scope.fooddate,
    logId: $scope.logId
  };


  foodlog.bigDataToMyDataBase(data)
  .success(function(data){
    console.log("HELLO D", data);
    generateAllFoods();
  });
};

  $scope.createSavedFood = function(){
    var createfood = null;

    if(createfood === undefined){
      $scope.nothingHere = true;
    }
    else{
      $scope.myfood = $scope.myfood.toLowerCase()
        .split(' ').map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        }).join(' ');

      createdfood = {
        foodname: $scope.myfood,
        quantity: $scope.quantity,
        calories: $scope.calories,
        total_fat: $scope.total_fat,
        saturated_fat: $scope.saturated_fat,
        cholesterol: $scope.cholesterol,
        sodium: $scope.sodium,
        carbohydrates: $scope.carbohydrates,
        fiber: $scope.fiber,
        sugars: $scope.sugars,
        protein: $scope.protein
      };


      var data = {
        food: createdfood,
        username: $rootScope.username,
        id: $scope.logId
      };

      foodlog.createsavedfood(data)
      .success(function(data){
        console.log("SOOO EASY, NOT!", data);
        generateAllFoods();
      })
      .error(function(data){
        console.log("failed");
      });
    }

  };



  $scope.submitSavedFoods = function(){

    var foodname2 = $scope.foodname2
    console.log("BAH2", foodname2);
    if(foodname2 === undefined) {
      $scope.enteredNada2 = true;
      //used timeout so flash statement disappears after user re-enters in input bar
      setTimeout(function(){$scope.enteredNada2 = false}, 1000);
      console.log("here")
    }
    else{

      foodname2 = $scope.foodname2.toLowerCase()
        .split(' ').map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        }).join(' ');

      var data = {
        username: $rootScope.username,
        food: foodname2,
        logId: $scope.logId
      };

      foodlog.submitsavedfoods(data)
      .success(function(data){
        console.log(data);

        generateAllFoods();

      })
      .error(function(data){
        console.log("You never created that food!");
        $scope.notfound = true;
        setTimeout(function(){$scope.notfound = false}, 1500);
        setTimeout(function(){generateAllFoods();}, 1600);
      });
    }
  };


});
