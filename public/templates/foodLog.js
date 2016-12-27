var app = angular.module('foodlog',['ui.router', 'ngAnimate', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider){
  $stateProvider

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
  });
  $urlRouterProvider.otherwise('/');
});

app.factory('foodlog', function factory($http, $rootScope, $cookies) {
  var service = {};
  // var appId ='63be4ab8'
  // var API_KEY = '060f94e8ed4e0561c70e4651b4983d87'

  service.alllogs = function(){
    return $http ({
      method: 'GET',
      url: '/alllogs',
      params: {username: "Dom"}

    });
  };

  service.createlog = function() {
    return $http ({
      method: 'GET',
      url: '/createlog',
      params: {username: "Dom"}
    });
  };

  service.del = function(id){
    return $http ({
      method: 'POST',
      url: '/delete',
      data: {id: id, username: "Dom"},
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
              username: "Dom"
            }
    });
  };

  service.allsaved = function(){
    return $http ({
      method: 'GET',
      url: '/allsaved',
      params: {username: "Dom"}
    });
  };

  service.foodListInLog = function(id){
    return $http ({
      method: 'GET',
      url: '/log/' + id,
      params: {username: "Dom"}
    });
  };

  service.searchBigData = function(foodname){
    var url = "https://api.nutritionix.com/v1_1/search/" + foodname + "?results=0%3A20&cal_min=0&cal_max=50000&fields=item_name%2Cnf_calories%2Cnf_total_fat%2Cnf_saturated_fat%2Cnf_cholesterol%2Cnf_sodium%2Cnf_total_carbohydrate%2Cnf_dietary_fiber%2Cnf_sugars%2Cnf_protein&appId=63be4ab8&appKey=060f94e8ed4e0561c70e4651b4983d87";
    return $http ({
      method: 'GET',
      url: url,
      params: {username: "Dom"}
    });
  };
  service.bigDataToMyDataBase = function(data){
    return $http ({
      method: 'POST',
      url: '/foodToDatabase',
      data: data
    });
  };
  service.submitsavedfoods = function(data){
    return $http ({
      method: 'POST',
      url: '/submitsavedfoods',
      data: data
    });
  };
  service.createsavedfood = function(data){
    return $http ({
      method: 'POST',
      url: '/createsavedfood',
      data: data
    });
  };
    return service;
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
  $state.go('log', {logId: data._id });

})
.error(function(data){
  console.log("failed");
});
};
});

app.controller('customfoodsController', function($scope, foodlog){

  $scope.custom = function(){

    foodlog.allsaved()
    .success(function(data){

    }).
    error(function(data){
      console.log("failed");
    });
  };

});


app.controller('logController', function($scope, foodlog, $state, $stateParams) {
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


  data.forEach(function(food){
    if(food.quantity){
      sumQty += food.quantity;
    }
    if(food.calories){
      sumCal += food.calories;
    }
    if(food.totalFat){
      sumTFat += food.totalFat;
    }
    if(food.saturatedFat){
      sumFat += food.saturatedFat;
    }
    if(food.cholesterol){
      sumCho += food.cholesterol;
    }
    if(food.sodium){
      sumSo += food.sodium;
    }
    if(food.carbohydrates){
      sumCarb += food.carbohydrates;
    }
    if(food.fiber){
      sumFi += food.fiber;
    }
    if(food.sugars){
      sumSug += food.sugars;
    }
    if(food.protein){
      sumPro += food.protein;
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


})
.error(function(data){
  console.log("failed");
});
};

generateAllFoods();

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

$scope.submitFood =function(){

foodname = $scope.foodname;
console.log("BAH", foodname);
if(foodname === undefined) {
  $scope.enteredNada = true;
}
else{

foodlog.searchBigData(foodname)
.success(function(data){
  console.log(data.hits[0].fields);
  $scope.fooditem = data.hits[0].fields;
})
.success(function(){
  var data = {
    username: "Dom",
    food: $scope.fooditem,
    logId: $scope.logId
  };
  foodlog.bigDataToMyDataBase(data)
  .success(function(data){
    console.log("HELLO", data);
    generateAllFoods();



  })
.error(function(data){
  console.log("failed");
});
});
}
};

$scope.createSavedFood = function(){
var createfood = null;

if(createfood === undefined){
  $scope.nothingHere = true;
}
else{
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
    username: "Dom",
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

  foodname2 = $scope.foodname2;
  console.log("BAH", foodname2);

  var data = {
    username: "Dom",
    food: $scope.foodname2,
    logId: $scope.logId
  };

  if(foodname2 === undefined) {
    $scope.enteredNada2 = true;
    console.log("here")
  }
  else{
    foodlog.submitsavedfoods(data)
    .success(function(data){
      console.log(data);
      generateAllFoods();
    })
    .error(function(data){
      console.log("failed");
    });
}
};


});
