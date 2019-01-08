const Discord = require("discord.js");
const bot = new Discord.Client();
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYoutubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
const superagent = require("superagent");
const colours = require("./colours.json");

var config = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;

bot.on('ready', async () =>{ //CMD green light
  console.log(`${bot.user.username} is online`);
  bot.user.setActivity("Hello :cowboy:",{type: "STREAMING"})
});

var queue = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipRequest = 0;
var skippers = [];
var currentSongID = "";


bot.login(discord_token);


bot.on('message', async message => { //Allows the bot to reply when pinged
  const prefixRegex = new RegExp(`^(<@!?${bot.user.id}>|\\${prefix})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const command = args.shift();

  if (command === '') { //@ing the bot
    message.delete();
    message.channel.send("**Current commands** :stuck_out_tongue: :triumph: :kissing_smiling_eyes:  \n       :one: TENISplay " +
      "\n       :two: TENISskip \n       :three: TENISnow \n       :four: TENISqueue \n       :five: TENIStalk \n       :six: TENIShead \n       :seven: TENISleave \n       :eight: TENISdog \n       :nine: TENIScat \n       :fire: Special Words: tenisxd, sup tenis, im");
  }else if(command === "cat"){
      let msg = await message.channel.send("Generating meowxd...");

      let {body} = await superagent

      .get(`http://aws.random.cat/meow`)
      if(!{body}) return message.channel.send("i dieeeed")

      let mEmbed = new Discord.RichEmbed()
      .setColor(colours.blue)
      .setAuthor(`Cats meow :3`, message.guild.iconURL)
      .setImage(body.file)
      .setTimestamp()

      message.channel.send({embed: mEmbed})

      msg.delete();

  }else if(command === "dog"){
      let msg = await message.channel.send("Generating dogowo...");

      let {body} = await superagent
      .get(`https://dog.ceo/api/breed/shiba/images/random`)
      if(!{body}) return message.channel.send("i dieeeed")

      let dEmbed = new Discord.RichEmbed()
      .setColor(colours.blue)
      .setAuthor(`Dogos owo`, message.guild.iconURL)
      .setImage(body.message)
      .setTimestamp()

      message.channel.send({embed: dEmbed})

      msg.delete();

  }
});

var skipState = false;
var queueTitles = [];
var leaveState = false;

bot.on('message', function(message){
  const mess = message.content;
  if((mess === (prefix + "commit") && message.author.id === "198586512210788352")){
    message.reply(" the changes have been applied: 3");
  }
});

bot.on('message', async function(message) {
  const member = message.member; //Person who sent the message
  const mess = message.content; //The content of the message sent
  const args = message.content.split(' ').slice(1).join(" ");

  if (mess.startsWith(prefix + "play")) {
    if (member.voiceChannel) {
      message.member.voiceChannel.join();
      leaveState = false;
      if (queue.length > 0 || isPlaying) { //Adding to queue
        getID(args, function(id) {
          addToQueue(id);
          fetchVideoInfo(id, function(err, videoInfo) {
            if (err) throw new Error(err);
            message.channel.send(`<@${message.author.id}> added https://www.youtube.com/watch?v=` + id + " to the queue.");
            queueTitles.push(videoInfo.title);
          });
        });
      } else { //It's not playing or queue > 1
        isPlaying = true;
        getID(args, function(id) {
          queue.push("placeholder");
          playMusic(id, message);
          fetchVideoInfo(id, function(err, videoInfo) {
            if (err) throw new Error(err);
          });
        });
      }
    } else {
      message.channel.send(`<@${message.author.id}> you need to be in a voice channel.`);
    }
  } else if (mess === (prefix + "skip")) {
    if(message.member.voiceChannel){
      if (queue.length > 0 || isPlaying){
        skipState = true;
        if (skippers.indexOf(message.author.id == -1)) {
          skippers.push(message.author.id);
          skipRequest++;
          skipSong(message);
          message.channel.send("Song skipped.");
          if (queue.length > 0 || isPlaying) {
            message.channel.send("Now playing https://www.youtube.com/watch?v=" + queue[0]);
          }
          skipState = false;
        } else {
          message.reply("You already voted");
        }
      } else {
        message.channel.send("The queue is empty.");
      }
    }else{
      message.channel.send(`<@${message.author.id}> you need to be in a voice channel to execute this command.`);
    }

  } else if (mess ===(prefix + "leave")) {

    if (message.member.voiceChannel) {
      message.channel.send("I'm fucking leaving :triumph:");
      queueTitles = [];
      queue = [];
      isPlaying = false;
      leaveState = true;
      message.guild.voiceConnection.disconnect();
    } else {
      message.channel.send(`<@${message.author.id}> you need to be in a voice channel to execute this command.`);
    }

  } else if (mess === (prefix + "queue")) {
    if (queueTitles.length > 0) {
      message.channel.send("**Queue:**" + getQueue());
    } else {
      message.channel.send("The queue is empty.");
    }
  } else if (mess === (prefix + "now")) {
    if (queue.length > 0 || isPlaying) {
      var currentSong = "https://www.youtube.com/watch?v=" + currentSongID;
      message.channel.send("Current song: " + currentSong);
    } else {
      message.channel.send("The queue is empty.");
    }
  } else if (mess === (prefix + "talk")) {
    var quote = "";

    var quotes = ["if ur vegan and drink water ur hypocrite ur destroying fish home", "every time a girl says hi to me I go into the bathroom immediately and furiously masturbate", "i would like to suck dick just once tho just to feel how they taste and at the end i would say no homo", "die urself", "i got my iphone 5 stolen by a nigger and now i hav to use android phone with 2gb :sob:", "u must be medusa bc u make me rock hard", "You like maths? Cause I want to ADD to you my life, SUBTRACT your clothes, DIVIDE your legs and MULTIPLY ourselves", "Are you a Disney princess? Cause you're cinderHella fine!", "Girls, are those space pants? Cause your butt is out of this world!", "Are you harambes enclosure? Cause i'll drop a kid inside of you!", "deltadragon i raped more women in an hour than u have fucked ur girlfriend in ur entire lifetime"];

    quote = quotes[getRandomInt(quotes.length)];
    message.channel.send(`<@${message.author.id}> ` + quote);

  } else if (mess === (prefix + "head")) {
    const vexHead = ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":notebook_with_decorative_cover::black_large_square::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::black_large_square::notebook_with_decorative_cover:\n" +
      ":notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover::black_large_square::black_large_square::notebook_with_decorative_cover::notebook_with_decorative_cover::notebook_with_decorative_cover:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:";

    const tenisHead = ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::black_large_square::blue_book::blue_book::black_large_square::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::black_large_square::blue_book::black_large_square::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::black_large_square::black_large_square::black_large_square::blue_book::blue_book:\n" +
      ":blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book::blue_book:";

    const inlocHead =      ":black_large_square:️:white_large_square:️:white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_large_square:️:black_large_square:️\n"+
    ":white_large_square:️:white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_large_square:️\n"+":white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark:\n"+
    ":white_check_mark::u7121:️:u7121:️:u7121:️:u7121:️:u7981::u7981::white_check_mark:\n"+
    ":white_check_mark::u7121:️:u7121:️:u7121:️:u7981::u7981::u7981::white_check_mark:\n"+
    ":white_check_mark::u7121:️:u7121:️:u7981::u7981::u7981::u7981::white_check_mark:\n"+
    ":white_check_mark::white_check_mark::u7981::u7981::u7981::u7981::white_check_mark::white_check_mark:\n"+
    ":white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark::white_check_mark:";

    const nyHead = ":black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:\n"+
    ":black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square::black_large_square:\n"+
    ":black_large_square::hibiscus::hibiscus::black_large_square::black_large_square::hibiscus::hibiscus::black_large_square:\n"+
    ":black_large_square::hibiscus::milky_way::black_large_square::black_large_square::milky_way::hibiscus::black_large_square:\n"+
    ":black_large_square::black_large_square::black_large_square::hibiscus::hibiscus::black_large_square::black_large_square::black_large_square:\n"+
    ":black_large_square::black_large_square::hibiscus::milky_way::milky_way::hibiscus::black_large_square::black_large_square:\n"+
    ":black_large_square::black_large_square::milky_way::milky_way::milky_way::milky_way::black_large_square::black_large_square:\n"+
    ":black_large_square::black_large_square::milky_way::black_large_square::black_large_square::milky_way::black_large_square::black_large_square:";

    const boogerHead = ":black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️\n"+
    ":black_large_square:️:white_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:white_large_square:️:black_large_square:️\n"+
    ":black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️\n"+
    ":black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:white_large_square:️:black_large_square:️:black_large_square:️:white_large_square:️\n"+
    ":white_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:white_large_square:️\n"+
    ":white_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:white_large_square:️:black_large_square:️\n"+
    ":black_large_square:️:white_large_square:️:white_large_square:️:white_large_square:️:white_large_square:️:white_large_square:️:black_large_square:️:black_large_square:️\n"+
    ":black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️:black_large_square:️";

    const heads = [vexHead, tenisHead,inlocHead,nyHead, boogerHead];
    var s = heads[getRandomInt(heads.length)]
    message.channel.send("\n" + s);

  } else if (mess.toLowerCase().startsWith("sup")) {
    if(!message.author.bot){
      var supSplit = message.content.split(" ");
      if(supSplit[1] === "" || supSplit[1] === "tenis"){
        message.channel.send(`<@${message.author.id}> sup :stuck_out_tongue: :kissing_smiling_eyes: `);
      }
    }
  } else if (mess.toLowerCase().startsWith("im ") || mess.toLowerCase().startsWith("i'm ")) {
    var messagesplit = message.content.split(" ");
    if(message.author.id != "529372644634787850"){
      if(messagesplit[1] === "autistic"){
        message.channel.send(`no <@${message.author.id}> i'm autistic :blush:`)
      }else if(messagesplit[1] === "tenis"){
        message.channel.send(`no <@${message.author.id}> i'm tenis :rage:`)
      }else if(messagesplit.length > 1){
        const tenisSay = ["im tenis from night vision"];
        var mes = "";
        for(var i =0;i<messagesplit.length;i++){
          if(i != 0){
              mes+=messagesplit[i]+" ";
          }
        }
        message.channel.send(`Hi `+mes+`, `+ tenisSay[getRandomInt(tenisSay.length)]);
      }
    }
  } else if (mess === "tenisxd") {
    message.delete();
    const tenisPics = ["https://imgur.com/h587aEx", "https://imgur.com/SFZ5A3Q", "https://imgur.com/4yvEggf", "https://imgur.com/gdgeJIw", "https://imgur.com/bIrHeFt", "https://imgur.com/6HTOSiB", "https://imgur.com/OtLtkXL", "https://imgur.com/T146I5Z", "https://imgur.com/mhIRKQH", "https://imgur.com/4aYnuRw", "http://prntscr.com/kia1ek", "http://prntscr.com/jqxa92", "https://i.imgur.com/Ivbczhw.png", "https://imgur.com/rc3DjHh", "http://prntscr.com/hl3vdw","https://imgur.com/VVmH9bT","https://imgur.com/RUU3Szn","https://imgur.com/RzdOIhS","https://imgur.com/kzVpmQP","https://imgur.com/AoWiwx8","https://imgur.com/s0fzNvz","https://imgur.com/EO6qcOj","https://imgur.com/iOXd2hr","https://imgur.com/BuWy2sc","https://imgur.com/ZkMPiY9","https://imgur.com/ZeSlqM3","https://imgur.com/CQrc6w2","https://imgur.com/wSysFRD","https://imgur.com/NftC6u3"];
    var rPic = "";
    rPic = tenisPics[getRandomInt(tenisPics.length)];
    message.channel.send(rPic);
  }
});

function skipSong() {
  dispatcher.end();
}

function getQueue(){
  var playlist = "";
  if (queueTitles.length > 0) {
    for (var i = 0; i < queueTitles.length; i++) {
      playlist += "\n        **" + (i + 1) + "-** " + queueTitles[i];
    }
  }
  return playlist;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function playMusic(id, message) {
  if (leaveState == false) {
    if (skipState == false) {
      message.channel.send("Now playing https://www.youtube.com/watch?v=" + id);
    }
    voiceChannel = message.member.voiceChannel;
    currentSongID = id;

    voiceChannel.join().then(function(connection) {
      stream = ytdl("https://www.youtube.com/watch?v=" + id, {
        filter: 'audioonly'
      });
      skipRequest = 0;
      skippers = [];

      dispatcher = connection.playStream(stream);
      dispatcher.on('end', function() {
        skipRequest = 0;
        skippers = [];
        queue.shift();
        queueTitles.shift();
        if (queue.length == 0) {
          queue = [];
          queueTitles = [];
          isPlaying = false;
        } else {
          playMusic(queue[0], message);
        }
      });
    });
  }
}

function getID(str, cb) {
  if (isYoutube(str)) {
    cb(getYoutubeID(str));
  } else {
    search_video(str, function(id) {
      cb(id);
    });
  }
}

function addToQueue(strID) {
  if (isYoutube(strID)) {
    queue.push(getYoutubeID(strID));
  } else {
    queue.push(strID);
  }
}

function search_video(query, callback) {
  request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
    var json = JSON.parse(body);
    callback(json.items[0].id.videoId);
  });
}

function isYoutube(str) {
  return str.toLowerCase().indexOf("youtube.com") > -1;
}
