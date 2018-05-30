require('dotenv').config();
const ignore = 399984411501658151
const Eris = require("eris");
const { VoiceText } = require('voice-text');
const { writeFileSync } = require('fs');

const voiceText = new VoiceText(process.env.Token_VoiceText);
const bot = new Eris(process.env.Token_Discord);

var connection = null;
var textBuffer = [];
const ChannelName = 'general'
var userVoice = {};
var userSpeed = {};
var userPitch = {};
const VoiceTable = ['hikari', 'haruka', 'takeru', 'santa', 'bear', 'show'];
const EmotionTable = ['happiness', 'anger', 'sadness'];

bot.on("ready", () => { // When the bot is ready
    bot.guilds.forEach((guild) => {
        var flag = true;
        guild.channels.forEach((channel) => {
            if (channel.name === ChannelName) {
                flag = false;
            }
        })
        if (flag) {
            var parent = guild.channels.find((channel) => {
                return channel.name === 'Text Channels';
            })
            guild.createChannel(ChannelName, 0, '', parent.id);
        }
    })
    console.log("Ready!"); // Log "Ready!"
});

bot.on("messageCreate", (msg) => { // When a message is created
    if (msg.mentions.some((user) => {
            return user.id === bot.user.id;
        })) {
        var text = msg.content;
        var arr = text.split(' ');
        var commands = [];
        commands.push({
            alias: 'join',
            fn: (name) => {
                var channel = msg.channel.guild.channels.find((channel) => {
                    return channel.name === name && channel.type === 2;
                })
                if (!channel) {
                    return false;
                }
                bot.joinVoiceChannel(channel.id).then((con) => {
                    connection = con;
                    connection.on('end', () => {
                        if (textBuffer.length) {
                            connection.play(getYomiageStream(textBuffer.shift()));
                        }
                    })
                });
                return true;
            }
        })

        commands.push({
            alias: 'leave',
            fn: () => {
                if (connection) {
                    //bot.leaveVoiceChannel(connection.id)
                    bot.leaveVoiceChannel(msg.member.voiceState.channelID);
                    textBuffer = [];
                    return true;
                }
                return false;
            }
        })

        commands.push({
            alias: 'voice',
            fn: (num) => {
                if (!(num in VoiceTable)) { return false; }
                userVoice[msg.author.id] = VoiceTable[num];
                return true;
            }
        })

        commands.push({
            alias: 'speed',
            fn: (num) => {
                if (num < 50 || 400 < num) { return false; }
                userSpeed[msg.author.id] = num;
                return true;
            }
        })

        commands.push({
            alias: 'pitch',
            fn: (num) => {
                if (num < 50 || 200 < num) { return false; }
                userPitch[msg.author.id] = num;
                return true;
            }
        })

        commands.push({
            alias: 'help',
            fn: () => {
                var m = "test"
                msg.send(m);

            }
        })

        var command;
        if (!arr.some((word, i) => {
                var com = commands.find((command) => {
                    return word === command.alias;
                })
                if (!com) {
                    return;
                }
                if (!com.fn(...arr.splice(i + 1)))
                    msg.addReaction('😥');
                return true;
            })) {
            msg.addReaction('😥');
        } else {
            return
        }
    }
    if (msg.channel.name !== ChannelName) { return; }
    if (!connection || msg.author.id == ignore) { return }
    if (connection.playing) {
        var voice = getVoiceByUser(msg.author.id);
        var speed = getSpeedByUser(msg.author.id);
        var pitch = getPitchByUser(msg.author.id);
        textBuffer.push({
            voice: voice,
            speed: speed,
            pitch: pitch,
            msg: msg.content
        });
    } else {
        var voice = getVoiceByUser(msg.author.id);
        var speed = getSpeedByUser(msg.author.id);
        var pitch = getPitchByUser(msg.author.id);
        var stream = getYomiageStream({
            voice: voice,
            speed: speed,
            pitch: pitch,
            msg: msg.content
        });
        connection.play(stream);
    }
})

function getVoiceByUser(id) {
    if (id in userVoice) {
        return userVoice[id];
    }
    var voice; 
    if (id == 433376996383391744){
        voice = VoiceTable[1];
    }else{
        voice = VoiceTable[id%6 + 1];
    }
    //var voice = VoiceTable[Math.floor(Math.random() * VoiceTable.length)];
    userVoice[id] = voice;
    return voice;
}

function getSpeedByUser(id) {
    if (id in userSpeed) {
        console.log(userSpeed[id]);
        return userSpeed[id];
    }
    var speed = 100;
    userSpeed[id] = speed;
    console.log(speed);
    return speed;
}

function getPitchByUser(id) {
    if (id in userPitch) {
        return userPitch[id];
    }
    var pitch = 100;
    userPitch[id] = pitch;
    return pitch;
}

function getYomiageStream(obj) {
//    console.log(obj.msg);
//    console.log(obj.voice);
//    console.log(obj.speed);
//    console.log(obj.pitch);

    return voiceText.stream(obj.msg, {
        speaker: obj.voice,
        speed: obj.speed,
        pitch: obj.pitch
    })
}
bot.connect(); // Get the bot to connect to Discord
