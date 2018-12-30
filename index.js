const Discord = require("discord.js");
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYoutubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");

var config = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));

const yt_api_key = config.yt_api_key;
//const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;

var queue = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipRequest = 0;
var skippers = [];
var currentSongID = "";


client.login(discord_token);


client.on('message', message => { //Allows the bot to reply when pinged
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|\\${prefix})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift();

    if (command === '') { //@ing the bot
      message.channel.send("**Current commands** :stuck_out_tongue: :triumph: :kissing_smiling_eyes:  \n:one: TENISplay \n:two: TENISskip \n:three: TENISqueue \n:four: TENIStalk \n:five: TENIShead \n:six: TENISsup");
    }
});


client.on('message', function(message){
  const member = message.member;
  const mess = message.content;
  const args = message.content.split(' ').slice(1).join(" ");

  if(mess.startsWith(prefix + "play")){ //client = bot, when a song neds it doesnt tells me the new song playing
    if(member.voiceChannel || client.guilds.get("427720724418002955").voiceConnection != null){
      if(queue.length > 0  || isPlaying){ //Adding to queue
        getID(args, function(id){
          addToQueue(id);
          fetchVideoInfo(id, function(err, videoInfo){
            if(err) throw new Error(err);
            message.reply(" added https://www.youtube.com/watch?v="+ id + " to queue.");
          });
        });
      }else{ //It's not playing or queue > 1
        isPlaying = true;
        getID(args, function(id){
          queue.push("placeholder");
          playMusic(id, message);
          fetchVideoInfo(id, function(err, videoInfo){
            if(err) throw new Error(err);
            message.reply(" now playing https://www.youtube.com/watch?v="+ id);
          });
        });
      }
    }else{
      message.reply(" you need to be in a voice channel.");
  }
}else if(mess.startsWith(prefix + "skip")){ //should tell me the thing above when I skip a song
    if(skippers.indexOf(message.author.id == -1)){
      skippers.push(message.author.id);
      skipRequest++;
      if(skipRequest >= Math.ceil((voiceChannel.members.size -1) / 2)){
        skipSong(message);
        message.channel.send(" song skipped.");
      }else{
        message.reply(" need **"+ Math.ceil((voiceChannel.members.size -1) / 2) - skipRequest + "** more skip votes.");
      }
    }else{
      message.reply("You already voted ok retard");
    }
  }else if(mess.startsWith(prefix + "queue")){ //broken af
    message.channel.send(getQueue());

  }else if(mess.startsWith(prefix + "now")){
    var currentSong = "https://www.youtube.com/watch?v="+currentSongID;
    message.channel.send("Current song: "+currentSong);

  }else if(mess.startsWith(prefix + "talk")){
    var quote = "";

    var quotes = ["if ur vegan and drink water ur hypocrite ur destroying fish home" ,"every time a girl says hi to me I go into the bathroom immediately and furiously masturbate", "i would like to suck dick just once tho just to feel how they taste and at the end i would say no homo", "die urself", "i got my iphone 5 stolen by a nigger and now i hav to use android phone with 2gb :sob:", "u must be medusa bc u make me rock hard", "You like maths? Cause I want to ADD to you my life, SUBTRACT your clothes, DIVIDE your legs and MULTIPLY ourselves", "Are you a Disney princess? Cause you're cinderHella fine!", "Girls, are those space pants? Cause your butt is out of this world!", "Are you harambes enclosure? Cause i'll drop a kid inside of you!", "deltadragon i raped more women in an hour than u have fucked ur girlfriend in ur entire lifetime"];

    quote  = quotes[getRandomInt(quotes.length)];
    message.reply(quote);

  }else if(mess.startsWith(prefix + "head")){
    const vexHead = ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n"+
                    ":black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:\n"+
                    ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n"+
                    ":notebook_with_decorative_cover::black_large_square::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::black_large_square::notebook_with_decorative_cover:\n"+
                    ":notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::black_large_square::black_large_square::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover:\n"+
                    ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n"+
                    ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n"+
                    ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:";

    const tenisHead = ":blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :black_large_square: :blue_book: :blue_book: :black_large_square: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :black_large_square: :blue_book: :black_large_square: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :black_large_square: :black_large_square: :black_large_square: :blue_book: :blue_book:\n"+
                    ":blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book: :blue_book:";

    const heads = [vexHead, tenisHead];
    var s = heads[getRandomInt(heads.length)]
    message.channel.send("\n"+s);
  }else if(mess.startsWith(prefix + "sup")){
    message.channel.send(`<@${message.author.id}> sup :tongue:`)
  }
});

client.on('ready', function (){ //CMD green light
  console.log("I am ready");
});

function skipSong(){
  dispatcher.end();
}

function getQueue(){ //Need to convert from array to string to fix the current error I assume idk
  var playlist = "";
  for(var i = 0;i<queue.length; i++){
    playlist+="\n"+i+"- "+queue[i];
  }
  return playlist;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function playMusic(id, message){
  voiceChannel = message.member.voiceChannel;
  currentSongID = id;

  voiceChannel.join().then(function(connection){
    stream = ytdl("https://www.youtube.com/watch?v="+ id, {
      filter: 'audioonly'
    });
    skipRequest = 0;
    skippers = [];

    dispatcher = connection.playStream(stream);
    dispatcher.on('end', function(){
      skipRequest = 0;
      skippers = [];
      queue.shift();
      if(queue.length == 0){
        queue = [];
        isPlaying = false;
      }else{
        playMusic(queue[0], message);

      }
    });
  });
}

function getID(str, cb){
  if(isYoutube(str)){
    cb(getYoutubeID(str));
  }else{
    search_video(str, function(id){
      cb(id);
    });
  }
}

function addToQueue(strID){
  if(isYoutube(strID)){
    queue.push(getYoutubeID(strID));
  }else{
    queue.push(strID);
  }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        callback(json.items[0].id.videoId);
    });
}

function isYoutube(str){
  return  str.toLowerCase().indexOf("youtube.com") > -1;
}
