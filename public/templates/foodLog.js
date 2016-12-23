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
      data: {id: id},
    });
  };

  service.delfoods = function(id, food){
    return $http ({
      method: "POST",
      url: '/delfoods',
      data: {
              id: id,
              food: food
            }
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
      url: url
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



app.controller('logController', function($scope, foodlog, $state, $stateParams) {
$scope.logId = $stateParams.logId;
console.log($scope.logId);


var generateAllFoods = function(){
foodlog.foodListInLog($scope.logId)
.success(function(data){
  console.log(data);
  $scope.food = data;
})
.error(function(data){
  console.log("failed");
});
};

generateAllFoods();

$scope.deleteFoods = function(food){
  foodlog.delfoods($scope.logId, food)
  .success(function(data){
    console.log(data);
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

// var createdfood = {
// foodname: $scope.myfood,
// quantity: $scope.quantity,
// calories: $scope.calories,
// total_fat: $scope.total_fat,
// saturated_fat: $scope.saturated_fat,
// cholesterol: $scope.cholesterol,
// sodium: $scope.sodium,
// carbohydrates: $scope.carbohydrates,
// fiber: $scope.fiber,
// sugars: $scope.sugars,
// protein: $scope.protein
// };
//
// };

};



$scope.submitSavedFoods = function(){

  foodname2 = $scope.foodname2;
  console.log("BAH", foodname);

  var data = {
    username: "Dom",
    food: $scope.foodname2,
    logId: $scope.logId
  };

  if(foodname2 === undefined) {
    $scope.enteredNada2 = true;
  }
  else{
    foodlog.submitsavedfoods(data)
    .success(function(data){
      console.log(data);
    })
    .error(function(data){
      console.log("failed");
    });
}
};


});
