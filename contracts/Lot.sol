pragma solidity >=0.4.21 <0.6.0;

contract Lot {
    // Model a Lottery
    struct Lottery {
        uint id;
        uint value;
        string player;
        uint numLucky;
   }

    mapping(uint => Lottery) public lotteries;
    uint public lotteriesCount;

    // addNumd event
    event addNumdEvent (
        uint indexed _LotteryId
    );

    function addLottery (uint _value, string memory _player) public {
        lotteriesCount ++;
        lotteries[lotteriesCount] = Lottery(lotteriesCount, _value, _player, 100);
    }

    function addLuckyNumber (uint num) public {
        lotteriesCount ++;
        lotteries[lotteriesCount] = Lottery(lotteriesCount, 100, "Nobody", num);
    }
}
