App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Lot.json", function (lot) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Lot = TruffleContract(lot);
      // Connect provider to interact with contract
      App.contracts.Lot.setProvider(App.web3Provider);

      App.listenForEvents();

      App.countDown();
      // App.winner();
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Lot.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.addNumdEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function () {
    var lotInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Lot.deployed().then(function (instance) {
      lotInstance = instance;
      return lotInstance.lotteriesCount();
    }).then(function (lotteriesCount) {
      var lotteriesResults = $("#lotteriesResults");
      lotteriesResults.empty();

      var winnersResult = $("#winnersResult");
      winnersResult.empty();

      var stt = 0;
      var winner;
      lotInstance.lotteries(lotteriesCount).then(function (numLucky) {
        for (var i = 1; i <= lotteriesCount; i++) {
          console.log("b")
          lotInstance.lotteries(i).then(function (lottery) {
            var id = lottery[0];
            var value = lottery[1];
            var player = lottery[2];

            //danh sach nhung nguoi choi va con so ho chon
            if (lottery[3].c == 100) {
              var LotteryTemplate = "<tr><td>" + id + "</td><td>" + value + "</td><td>" + player + "</td></tr>"
              lotteriesResults.append(LotteryTemplate);
            }

            //danh sach nguoi thang cuoc
            if (value.c[0] == numLucky[3].c[0]) {
              console.log(numLucky[3].c[0])
              stt += 1;
              winner = lottery[2];
              var WinnersTemplate = "<tr><td>" + stt + "</td><td>" + winner + "</td></tr>"
              winnersResult.append(WinnersTemplate);
            } 
          }).then(function() {
            //xu ly neu khong co nguoi thang cuoc
            console.log(stt)
            if (stt == 0) {
              var WinnersTemplate = "<tr><td>" + stt + "</td><td>" + "Nobody wins in this time :(" + "</td></tr>"
              winnersResult.append(WinnersTemplate);
            }
          })
        }        
      })
    }).then(function () {
      loader.hide();
      content.show();
    }).catch(function (error) {
      console.warn(error);
    });
  },

  //nguoi choi them so may man vao hop dong
  addNumber: function () {
    var yourNum = $('#yourNumber').val();
    if (yourNum < 0 || yourNum > 99) {
      alert("Your number must be from 0 to 99");
    } else {
      var account = App.account;
      App.contracts.Lot.deployed().then(function (instance) {
        return instance.addLottery(yourNum, account, { from: App.account });
      }).then(function () {
        window.location.reload();
      }).catch(function (err) {
        console.error(err)
      });
    }
  },

  //thiet lap thoi gian, random con so may man va ghi nó vao hop dong thong minh
  countDown: function () {
    //thiet lap thoi gian dem nguoc
    var timeCount = new Date("Jan 1, 2020 22:48:00").getTime(); // thời gian game kết thúc fix cứng
    var x = setInterval(function () {
      var now = new Date().getTime();
      var distance = timeCount - now;
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("timeOut").innerHTML = "The game will finish in: " + days + "d " + hours + "h "
        + minutes + "m " + seconds + "s ";

      //khi thoi gian ket thuc random va dua so vao smart contract
      if (distance < 0) {
        clearInterval(x);
        var number;
        App.contracts.Lot.deployed().then(function (instance) {
          lotInstance = instance;
          return lotInstance.lotteriesCount();
        }).then(function (lotteriesCount) {
          lotInstance.lotteries(lotteriesCount).then(function (lottery) {
            number = lottery[3];
            //random so khi la tai khoan admin va chua co so may man
            if (number.c[0] == 100) {
              if (App.account == "0xa47cdd4258314fd5b0553f9c06b70b343d8e7999") { //tài khoản admin fix cứng
                number = Math.floor(Math.random() * 2);
                App.contracts.Lot.deployed().then(function (instance) {
                  //them so may man
                  return instance.addLuckyNumber(number, { from: App.account });
                }).then(function () {
                  window.location.reload();
                }).catch(function (err) {
                  console.error(err);
                });
              } else {
                var time = new Date().getTime() + 5000;
                console.log(time);
                var y = setInterval(() => {
                  if(time - new Date().getTime() < 0) {
                    clearInterval(y);
                    window.location.reload();
                  }
                }, 1000);
              }
            } else {
              document.getElementById("timeOut").innerHTML = "Lucky number is: " + number;
              $('form').hide();
              $("#winners").show();
            }
          }).catch(function (err) {
            console.error(err);
          })
        })
      }
    }, 1000);
  },
};



$(function () {
  $(window).load(function () {
    App.init();
  });
});
