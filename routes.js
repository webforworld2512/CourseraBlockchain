'use strict';
var fs = require('fs');
const { exec } = require('child_process');
var crypto = require('crypto');
const Web3 = require('web3');
var web3 = new Web3();
var web3Node2 = new Web3();
const web3Admin = require('web3admin');
const directoryNode1 = "/home/ubuntu/Node_1";
const directoryNode2 = "/home/ubuntu/Node_2";
var connected = false;
var enode1;
var enode2;
var coinbase1;
var coinbase2;
var killing = false;
var score;
var scoreFile = "/home/ubuntu/score";
var ethhashFolder = "/home/ubuntu/.ethash";

module.exports = {
	checkEthereum: function(req, resp){
		getScoreFromFile();
		fs.readdir(directoryNode1, function(err, list){
			if(err){
				fs.readdir(directoryNode2, function(err,list){
					if(err){
						resp.json({"status":"complete", "message":"Instance of Ethereum not found at that location."});
						return;
					}
					resp.json({"status":"error","errorDetails":"You have already configured Ethereum. Please choose options below."});
					return;
				});
			}else{
				resp.json({"status":"error","errorDetails":"You have already configured Ethereum. Please choose options below."});
			}
		});
	},
	deleteEverything: function(req,resp){
		exec('rm '+ scoreFile, (err, stdout, stderr) =>{
			if(err){
				console.log(err);
				console.log(stdout);
				console.log(stderr);
			}
		});
		killing = true;
		exec('pkill geth', (err,stdout,stderr) =>{	
			exec('rm -rf ' + directoryNode1, (err,stdout,stderr) =>{
				if(err){
					killing = false
					resp.json({"status":"error", "errorDetails":"Unable to delete both the directories"});
					return;
				}
				exec('rm -rf ' + directoryNode2, (err,stdout,stderr) =>{
					if(err){
						killing = false
						resp.json({"status":"error", "errorDetails":"Unable to delete both the directories"});
						return;
					}
					killing = false;
					exec('rm -rf '+ ethhashFolder, (err,stdout, stderr) => {
						if(err){
							resp.json({"status":"error", "errorDetails":"Unable to delete the ethhash"});
							return;
						}
						resp.json({"status":"complete", "message":"Deleted everything successfully."});
					});
				});
			});
		});
	},
	configureEthereum: function(req, resp){
		var type = req.params.type;
		if(type == ":account"){

			var accountAddress1;
			var accountAddress2;
			exec('mkdir '+directoryNode1, (err,stdout,stderr) => {
				if(err){
					resp.json({"status":"error","errorDetails":"You have already created an account!"});		
					return
				}
				fs.writeFile(directoryNode1 + "/password.txt", req.body.password1, function(err){
					if(err){
						resp.json({"status":"error","errorDetails":"Unable to create a new account right now!"});		
						return;
					}
					exec('geth account new --password ' + directoryNode1 + '/password.txt --datadir '+ directoryNode1 , (err,stdout,stderr) =>{
						if(err){
							resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
							return;
						}
						accountAddress1 = stdout.split("{")[1];
						accountAddress1 = accountAddress1.substr(0, accountAddress1.length -2);
						exec('rm '+ directoryNode1 +'/password.txt', (err,stdout,stderr) =>{
							if(err){
								console.log("Error removing password file!");
							}
						});
						exec('mkdir '+directoryNode2, (err,stdout,stderr) => {
							if(err){
								resp.json({"status":"error","errorDetails":"You have already created an account!"});		
								return
							}
							fs.writeFile(directoryNode2 + "/password.txt", req.body.password2, function(err){
								if(err){
									resp.json({"status":"error","errorDetails":"Unable to create a new account right now!"});		
									return;
								}
								exec('geth account new --password ' + directoryNode2 + '/password.txt --datadir '+ directoryNode2 , (err,stdout,stderr) =>{
									if(err){
										resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
										return;
									}
									accountAddress2 = stdout.split("{")[1];
									accountAddress2 = accountAddress2.substr(0, accountAddress2.length -2);
									score.stage1 = 10;
									updateScoreToFile();
									resp.json({"status":"complete","accountAddress1":accountAddress1,"accountAddress2":accountAddress2});

									exec('rm '+ directoryNode2 +'/password.txt', (err,stdout,stderr) =>{
										if(err){
											console.log("Error removing password file!");
										}
									});
								});
							});
						});
					});
				});
			});
		}else if(type == ":genesis"){
			fs.writeFile(directoryNode1 + "/customGenesis.json", req.body.genesisData, function(err){
				if(err){
					resp.json({"status":"error","errorDetails":"Unable to create the Genesis file."});		
					return;
				}
				fs.writeFile(directoryNode2 + "/customGenesis.json", req.body.genesisData, function(err){
					if(err){
						resp.json({"status":"error","errorDetails":"Unable to create the Genesis file."});		
						return;
					}
					score.stage2 = 10;
					updateScoreToFile();
					resp.json({"status":"complete","message":"Created the Genesis Files with the name customGenesis.json in both nodes."});		
				});
			});
		}else if(type == ":init"){
			exec('geth init '+ directoryNode1 + '/customGenesis.json --datadir '+directoryNode1, (err,stdout,stderr) =>{
				if(err){
					resp.json({"status":"error","errorDetails":"Unable to initialize Ethereum. Invalid Genesis file found."});
					return;	
				}
				exec('geth init '+ directoryNode2 + '/customGenesis.json --datadir '+directoryNode2, (err,stdout,stderr) =>{
					if(err){
						resp.json({"status":"error","errorDetails":"Unable to initialize Ethereum. Invalid Genesis file found."});
						return;	
					}
					score.stage3 = 10;
					updateScoreToFile();
					resp.json({"status":"complete","message":"Initialized both Ethereum nodes. You may start them now."});
				});
			});
		}else if(type == ":start"){
			fs.readdir(directoryNode1, function(err, list){
				if(err){
					resp.json({"status":"error", "errorDetails":"Ethereum has not been configured right now."});
					return;
				}
				exec('geth --datadir '+ directoryNode1 + ' --maxpeers 95 --networkid 13 --nodiscover --rpc --rpccorsdomain "*" --port 30301 --rpcport 8544 --rpcapi="txpool,db,eth,net,web3,personal,admin,miner"', (err, stdout, stderr) =>{});
				exec('geth --datadir '+ directoryNode2 + ' --maxpeers 95 --networkid 13 --nodiscover --rpc --rpccorsdomain "*" --port 30302 --rpcport 8545 --rpcapi="txpool,db,eth,net,web3,personal,admin,miner"', (err, stdout, stderr) =>{});
				score.stage4 = 10;
				updateScoreToFile();
			});
		}

	},
	startWeb3: function(req, resp){
		if(connected == false){
			web3.setProvider(new Web3.providers.HttpProvider('http://localhost:8544'));
			web3Node2.setProvider(new Web3.providers.HttpProvider('http://localhost:8545'));
			setTimeout(function(){
				try{
					web3Admin.extend(web3);
					web3Admin.extend(web3Node2);
				}catch(e){
					resp.json({"status":"error", "errorDetails":"Unable to connect to Ethereum. Please go back and start it."});	
					return;
				}
				if(web3.isConnected() && web3Node2.isConnected()){
					enode1 = web3.admin.nodeInfo.enode;
					coinbase1 = web3.eth.coinbase;
					enode2 = web3Node2.admin.nodeInfo.enode;
					coinbase2 = web3Node2.eth.coinbase;
					getScoreFromFile();
					resp.json({"status":"complete", "message":"Connected with Ethereum node", "enode1":enode1, "coinbase1":coinbase1, "enode2":enode2, "coinbase2":coinbase2});
				}
				else
					resp.json({"status":"error", "errorDetails":"Unable to connect to Ethereum. Please go back and start it."});
			}, 1000);
			connected = true;
		}
		else{
			if(web3.isConnected() && web3Node2.isConnected()){
				enode1 = web3.admin.nodeInfo.enode;
				coinbase1 = web3.eth.coinbase;
				enode2 = web3Node2.admin.nodeInfo.enode;
				coinbase2 = web3Node2.eth.coinbase;
				getScoreFromFile();
				resp.json({"status":"complete", "message":"Connected with Ethereum node", "enode1":enode1, "coinbase1":coinbase1, "enode2":enode2, "coinbase2":coinbase2});
			}else{
				connected = false;
				resp.json({"status":"error", "errorDetails":"Unable to connect to Ethereum. Please go back and start it."});	
			}
		}	
	},
	ethereum: function(req,resp){
		var type = req.params.type;
		if(type == ":addPeer"){
			var result;
			try{
				result = web3.admin.addPeer(enode2);
			}catch(e){
				var index = e.toString().indexOf("invalid enode");
				if(index!=1){
					resp.json({"status":"complete", "addStatus":"Invalid enode provided. Please check enode and try again."});
					return;
				}
			}
			score.stage5 = 10;
			updateScoreToFile();
			resp.json({"status":"complete", "addStatus":"Enode added. You can check the connectivity using peer count or peers."})
		}else if(type == ":peerCount"){
			var node = req.body.node;
			var count;
			if(node == 1)
				count = web3.net.peerCount;
			else if(node == 2)
				count = web3Node2.net.peerCount;
			score.stage5 = 10;
			updateScoreToFile();
			resp.json({"status":"complete", "count":count});
		}else if(type == ":peers"){
			var node = req.body.node;
			var peers;
			if(node == 1)
				peers = web3.admin.peers;
			else if(node == 2)
				peers = web3Node2.admin.peers
			score.stage5 = 10;
			updateScoreToFile();
			if(peers.length == 0){
				resp.json({"status":"complete", "peers":"No Connected Peers"});	
			}else{
				resp.json({"status":"complete", "peers":JSON.stringify(peers,null,2)});	
			}
			
		}else if(type == ":unlockAccount"){
			var node = req.body.node;
			var account = req.body.account;
			var password = req.body.password;
			var result;
			if(node == 1){
				try{
					result = web3.personal.unlockAccount(account, password,36000);
				}catch(e){
					resp.json({"status":"complete", "unlock":"Incorrect Details Entered"});
					return;
				}
			}else if(node == 2){
				try{
					result = web3Node2.personal.unlockAccount(account, password,36000);
				}catch(e){
					resp.json({"status":"complete", "unlock":"Incorrect Details Entered"});
					return;
				}
			}
			score.stage7 = 10;
			updateScoreToFile();
			resp.json({"status":"complete", "unlock":"Account Unlocked"});
		}else if(type == ":newAccounts"){
			var node = req.body.node;
			var password = req.body.password;
			if(node == 1){
				accounts = web3.eth.accounts;
				if(accounts.length >= 5){
					resp.json({"status":"complete", "message":"You have already created total 5 accounts on this node."});
					return;
				}
				// for(var k=0; k<4; k++){
				// 	web3.personal.newAccount(password);
				// 	console.log("Node 1 account created");
				// }
				fs.writeFile(directoryNode1 + "/password.txt", password, function(err){
					if(err){
						resp.json({"status":"error","errorDetails":"Unable to create a new account right now!"});		
						return;
					}
					exec('geth account new --password ' + directoryNode1 + '/password.txt --datadir '+ directoryNode1 , (err,stdout,stderr) =>{
						if(err){
							resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
							return;
						}
						exec('geth account new --password ' + directoryNode1 + '/password.txt --datadir '+ directoryNode1 , (err,stdout,stderr) =>{
						if(err){
							resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
							return;
							}
							exec('geth account new --password ' + directoryNode1 + '/password.txt --datadir '+ directoryNode1 , (err,stdout,stderr) =>{
								if(err){
									resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
									return;
								}
								exec('geth account new --password ' + directoryNode1 + '/password.txt --datadir '+ directoryNode1 , (err,stdout,stderr) =>{
									if(err){
										resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
										return;
									}
									score.stage6 = 10;
									updateScoreToFile();
									resp.json({"status":"complete", "message":"Accounts created successfully!"});
								});
							});
						});
					});
				});
			}else if(node == 2){
				accounts = web3Node2.eth.accounts;
				if(accounts.length >= 5){
					resp.json({"status":"complete", "message":"You have already created total 5 accounts on this node."});
					return;
				}
				// for(var j=0; j<4; j++){
				// 	web3Node2.personal.newAccount(password);
				// 	console.log("Node 2 account created");
				// }
				fs.writeFile(directoryNode2 + "/password.txt", password, function(err){
					if(err){
						resp.json({"status":"error","errorDetails":"Unable to create a new account right now!"});		
						return;
					}
					exec('geth account new --password ' + directoryNode2 + '/password.txt --datadir '+ directoryNode2 , (err,stdout,stderr) =>{
						if(err){
							resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
							return;
						}
						exec('geth account new --password ' + directoryNode2 + '/password.txt --datadir '+ directoryNode2 , (err,stdout,stderr) =>{
						if(err){
							resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
							return;
							}
							exec('geth account new --password ' + directoryNode2 + '/password.txt --datadir '+ directoryNode2 , (err,stdout,stderr) =>{
								if(err){
									resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
									return;
								}
								exec('geth account new --password ' + directoryNode2 + '/password.txt --datadir '+ directoryNode2 , (err,stdout,stderr) =>{
									if(err){
										resp.json({"status":"error","errorDetails":"Error Creating your Account right now"});
										return;
									}
									score.stage6 = 10;
									updateScoreToFile();
									resp.json({"status":"complete", "message":"Accounts created successfully!"});
								});
							});
						});
					});
				});
			}
		}else if(type == ":balance"){
			var node = req.body.node;
			var balanceWei = [];
			var balanceEther = [];
			var accounts;
			if(node == 1){
				accounts = web3.eth.accounts;
				for(var i=0; i<accounts.length; i++){
					var balance = web3.eth.getBalance(accounts[i]);	
					balanceWei.push(balance);
					balanceEther.push(web3.fromWei(balance, "ether"));
				}
			}else if(node == 2){
				accounts = web3Node2.eth.accounts;
				for(var i=0; i<accounts.length; i++){
					var balance = web3Node2.eth.getBalance(accounts[i]);	
					balanceWei.push(balance);
					balanceEther.push(web3.fromWei(balance, "ether"));
				}
			}
			resp.json({"status":"complete", "account":accounts, "wei":balanceWei, "ether":balanceEther});
		}else if(type == ":minerStart"){
			var node = req.body.node;
			var status;
			if(node == 1){
				status = web3.miner.start(1);
			}else if(node == 2){
				status = web3Node2.miner.start(1);
			}
			score.stage8 = 10;
			updateScoreToFile();
			resp.json({"status":"complete", "message":"Miner Started"});
		}else if(type == ":minerStop"){
			var node = req.body.node;
			var status;
			if(node == 1){
				status = web3.miner.stop();
			}else if(node == 2){
				status = web3Node2.miner.stop();
			}
			resp.json({"status":"complete", "message":status});

		}else if(type == ":transaction"){
			var sender = req.body.sender;
			var receiver = req.body.receiver;
			var amount = req.body.amount;
			var node = req.body.node;
			var transactionObj = {from:sender, to:receiver, value:web3.toWei(amount, "ether")};
			var status;
			if(node == 1){
				try{
					status = web3.eth.sendTransaction(transactionObj);
				}catch(e){
					var index = e.toString().indexOf("authentication needed");
					if(index != -1){
						resp.json({"status":"complete", "transactionStatus":"Your account is locked. Can not initiate transaction."});
						return;
					}
					index = e.toString().indexOf("insufficient funds");
					if(index != -1){
						resp.json({"status":"complete", "transactionStatus":"Your account has insufficient funds for gas * price + amount that you want to send."});
						return;
					}
					resp.json({"status":"complete", "transactionStatus":"An unknown error occured."});
					return;
				}
			}else if(node == 2){
				try{
					status = web3Node2.eth.sendTransaction(transactionObj);
				}catch(e){
					var index = e.toString().indexOf("authentication needed");
					if(index != -1){
						resp.json({"status":"complete", "transactionStatus":"Your account is locked. Can not initiate transaction."});
						return;
					}
					index = e.toString().indexOf("insufficient funds");
					if(index != -1){
						resp.json({"status":"complete", "transactionStatus":"Your account has insufficient funds for gas * price + amount that you want to send."});
						return;
					}
					resp.json({"status":"complete", "transactionStatus":"An unknown error occured."});
					return;
				}
			}
			score.stage9 = 10;
			updateScoreToFile();
			resp.json({"status":"complete", "transactionStatus":"Transaction successfully submitted."});
		}else if(type == ":transactionStatus"){
			score.stage10 = 10;
			updateScoreToFile();
			var status = web3.txpool.status;	
			resp.json({"status":"complete", "pending":parseInt(status.pending,16), "queued":parseInt(status.queued,16)});
		}
	},
	submitScore: function(req, resp){
		if(score){
			var count = -1;
			for(var x in score){
				if(score[x] == 10)
					count++;
			}
			resp.json({"status":"complete", "hash":count.toString()+hashed(JSON.stringify(score))});
		}else{
			resp.json({"status":"error", "hash":"Unable to submit your score right now!"});
		}
	},
	checkDAG: function(req, resp){
		var number = web3.eth.blockNumber;
		if(number>0){
			resp.json({"status":"complete", "dagStatus":true});
		}else{
			resp.json({"status":"complete", "dagStatus":false});
		}
	}

}


function updateScoreToFile(){
	fs.writeFile(scoreFile, JSON.stringify(score), function(err){
		if(err){
			console.log(err);
			return;
		}
	});
}

function getScoreFromFile(){
	fs.readFile(scoreFile, (err,data) =>{
		if(err){
			score = {
				'stage1':0,
				'stage2':0,
				'stage3':0,
				'stage4':0,
				'stage5':0,
				'stage6':0,
				'stage7':0,
				'stage8':0,
				'stage9':0,
				'stage10':0
			}
			return;
		}		
		score = JSON.parse(data);
	});
}

function hashed(data){
	return crypto.createHash('md5').update(data).digest("hex");
}
