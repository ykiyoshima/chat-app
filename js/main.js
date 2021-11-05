import {
    convertFromFirestoreTimestampToDatetime,
    getFirestore,
    collection,
    ref,
    onValue,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    db,
} from './firebase.js'

let oldTempo = 128;
let currentTempo = 128;
let newTempo = 128;
let start = '';
let option = '';
let recCount = 0;
const time = [];
const loopSounds = ['arp', 'arp2', 'bu', 'chord', 'cl4', 'drop', 'dsc', 'dsd', 'kl4', 'kl8', 'kl16', 'piano', 'vcd']
const nonLoopSounds = ['clap', 'crash', 'ipt', 'kick', 'nu', 'snare'];
const padsArray = [];

const c = 'a'.charCodeAt(0);
const alphabets = Array.apply(null, new Array(26)).map((v, i) => {
    return String.fromCharCode(c + i);
});

// loopSoundsのhtmlタグ生成
for (let i = 0; i < loopSounds.length; i++) {
    $('#loop-sounds-container').append(`<div id="loop-sounds-contents"><div id="${loopSounds[i]}" class="loop-sound${i} pad"><p>${loopSounds[i]}</p></div><p>${alphabets[i]}</p></div>`).trigger('create');
    $(`#${loopSounds[i]}`).css('background-color', `hsl(${360 * i / loopSounds.length}, 100%, 33%)`)
}
// nonLoopSoundsのhtmlタグ生成
for (let i = 0; i < nonLoopSounds.length; i++) {
    $('#non-loop-sounds-container').append(`<div id="non-loop-sounds-contents"><div id="${nonLoopSounds[i]}" class="non-loop-sound${i} pad"><p>${nonLoopSounds[i]}</p></div><p>${alphabets[i + loopSounds.length]}</p></div>`).trigger('create');
    $(`#${nonLoopSounds[i]}`).css('background-color', `hsl(${360 * i / nonLoopSounds.length}, 100%, 33%)`)
}

class soundClass {
    constructor(sound, soundTime, fixedSoundTime, soundCount, soundPlay, fixedSoundPlay, name, index) {
        this.sound = sound;
        this.soundTime = soundTime;
        this.fixedSoundTime = fixedSoundTime;
        this.soundCount = soundCount;
        this.soundPlay = soundPlay;
        this.fixedSoundPlay = fixedSoundPlay;
        this.name = name + 'Data';
        this.index = index;
    }
}

let arp = new soundClass([], [], [], 1, [], [], 'arp', 0);
let arp2 = new soundClass([], [], [], 1, [], [], 'arp2', 1);
let bu = new soundClass([], [], [], 1, [], [], 'bu', 2);
let chord = new soundClass([], [], [], 1, [], [], 'chord', 3);
let clap = new soundClass([], [], [], 1, [], [], 'clap', 4);
let cl4 = new soundClass([], [], [], 1, [], [], 'cl4', 5);
let crash = new soundClass([], [], [], 1, [], [], 'crash', 6);
let drop = new soundClass([], [], [], 1, [], [], 'drop', 7);
let dsc = new soundClass([], [], [], 1, [], [], 'dsc', 8);
let dsd = new soundClass([], [], [], 1, [], [], 'dsd', 9);
let ipt = new soundClass([], [], [], 1, [], [], 'ipt', 10);
let kick = new soundClass([], [], [], 1, [], [], 'kick', 11);
let kl4 = new soundClass([], [], [], 1, [], [], 'kl4', 12);
let kl8 = new soundClass([], [], [], 1, [], [], 'kl8', 13);
let kl16 = new soundClass([], [], [], 1, [], [], 'kl16');
let nu = new soundClass([], [], [], 1, [], [], 'nu');
let piano = new soundClass([], [], [], 1, [], [], 'piano');
let snare = new soundClass([], [], [], 1, [], [], 'snare');
let vcd = new soundClass([], [], [], 1, [], [], 'vcd');

const sounds = [arp, arp2, bu, chord, cl4, drop, dsc, dsd, kl4, kl8, kl16, piano, vcd, clap, crash, ipt, kick, nu, snare];
const soundNames = ['arp', 'arp2', 'bu', 'chord', 'cl4', 'drop', 'dsc', 'dsd', 'kl4', 'kl8', 'kl16', 'piano', 'vcd', 'clap', 'crash', 'ipt', 'kick', 'nu', 'snare'];
const soundData = ['arpData', 'arp2Data', 'buData', 'chordData', 'cl4Data', 'dropData', 'dscData', 'dsdData', 'kl4Data', 'kl8Data', 'kl16Data', 'pianoData', 'vcdData', 'clapData', 'crashData', 'impData', 'kickData', 'nuData', 'snareData'];
// const soundsPlay = [arpPlay, arp2Play, chordPlay, claploop4Play, dropPlay, dubstepchordPlay, dubstepdrumPlay, kickloop4Play, kickloop8Play, kickloop16Play, pianoPlay, vocoderPlay, clapPlay, crashPlay, impactPlay, kickPlay, noiseupPlay, snarePlay];

loopSounds.forEach((value) => {
    $('body').on('click', `#${value}`, function () {
        $(`#${value}-sound`).get(0).volume = 0.5;
        $(`#${value}-sound`).get(0).currentTime = 0;
        // キック音を再生する（ループなし）
        $(`#${value}-sound`).get(0).play();
        $(`#${value}-sound`).get(0).loop = false;
    });
});
nonLoopSounds.forEach((value) => {
    $('body').on('click', `#${value}`, function () {
        $(`#${value}-sound`).get(0).volume = 0.5;
        $(`#${value}-sound`).get(0).currentTime = 0;
        // キック音を再生する（ループなし）
        $(`#${value}-sound`).get(0).play();
        $(`#${value}-sound`).get(0).loop = false;
    });
});

// 録音開始ボタンを押したとき
$('#rec-start').on('click', function () {
    // 録音開始ボタンを非表示にする
    $('#rec-start').removeClass('active');
    // 録音停止ボタンを表示する
    $('#rec-stop').addClass('active');
    console.log('start!');
    // 録音開始時のタイムスタンプを押す
    start = performance.mark('start');

    // メトロノームを鳴らす
    let metronome = setInterval(function () {
        $('#low').get(0).play();
        setTimeout(function () {
            $('#low').get(0).pause();
            $('#low').get(0).currentTime = 0;
        }, 100)
        $('#rec-stop').on('click', function () {
            clearInterval(metronome);
        });
    }, 60 / currentTempo * 1000);

    // 各ドラムパーツごとの配列の中身が空だったら録音開始のタイムスタンプを追加する
    for (let i = 0; i < sounds.length; i++) {
        if (sounds[i].sound.length === 0) {
            sounds[i].sound.push(start);
            // 古い録音開始のタイムスタンプが追加されていたらそれを消して新しいタイムスタンプを追加する
        } else if (sounds[i].sound.slice(-1)[0].name === 'start') {
            sounds[i].sound.length = 0;
            sounds[i].sound.push(start);
        }
    }
    console.log(arp.sound[0]);

    // キーボードのキーを押したとき
    $(document).on('keydown', function (e) {
        for (let i = 0; i < sounds.length; i++) {
            switch (e.keyCode) {
                case (65 + i):
                    $(`#${soundNames[i]}`).addClass('played');
                    sounds[i].sound.push(performance.mark('sound' + sounds[i].soundCount));
                    sounds[i].soundTime.push(sounds[i].sound[sounds[i].soundCount].startTime - sounds[i].sound[0].startTime);
                    $(`#${soundNames[i]}-sound`).get(0).volume = 0.5;
                    $(`#${soundNames[i]}-sound`).get(0).currentTime = 0;
                    // キック音を再生する（ループなし）
                    $(`#${soundNames[i]}-sound`).get(0).play();
                    $(`#${soundNames[i]}-sound`).get(0).loop = false;
                    // キック画像ハイライト用のクラス属性を削除する
                    setTimeout(function () {
                        $(`#${soundNames[i]}`).removeClass('played');
                    }, 200);
                    // Kキーの入力回数をカウントする
                    sounds[i].soundCount++;
            }
        }
    });

    sounds.forEach((value, index) => {
        for (let i = 0; i < value.fixedSoundTime.length; i++) {
            value.fixedSoundPlay.push('');
            // メトロノームが8回鳴った後のキック音を再生する
            value.fixedSoundPlay[i] = setTimeout(function () {
                $(`#${soundNames[index]}`).addClass('played');
                $(`#${soundNames[index]}-sound`).get(0).volume = 0.2;
                $(`#${soundNames[index]}-sound`).get(0).currentTime = 0;
                $(`#${soundNames[index]}-sound`).get(0).play();
                $(`#${soundNames[index]}-sound`).get(0).loop = false;
                setTimeout(function () {
                    $(`#${soundNames[index]}`).removeClass('played');
                }, 200);
            }, value.fixedSoundTime[i]);
            // 録音停止ボタンを押したら録音停止ボタンを非表示にして録音開始ボタンを表示する
            $('#rec-stop').on('click', function () {
                clearTimeout(value.fixedSoundPlay[i]);
                $(`#${soundNames[index]}-sound`).get(0).pause();
            });
        }
        $('#rec-stop').on('click', function () {
            $('#rec-stop').removeClass('active');
            $('#rec-start').addClass('active');
            return;
        });
    });
});

// 演奏再生ボタンを押したとき
$('#play-start').on('click', function () {
    // 演奏停止ボタンを表示する
    $('#play-start').removeClass('active');
    $('#play-stop').addClass('active');
    // Kキーが押された回数だけ以下の処理を繰り返す
    sounds.forEach((value, index) => {
        for (let i = 0; i < value.soundTime.length; i++) {
            value.soundPlay.push('');
            // メトロノームが8回鳴った後のキック音を再生する
            value.soundPlay[i] = setTimeout(function () {
                $(`#${soundNames[index]}`).addClass('played');
                $(`#${soundNames[index]}-sound`).get(0).volume = 0.5;
                $(`#${soundNames[index]}-sound`).get(0).currentTime = 0;
                $(`#${soundNames[index]}-sound`).get(0).play();
                $(`#${soundNames[index]}-sound`).get(0).loop = false;
                setTimeout(function () {
                    $(`#${soundNames[index]}`).removeClass('played');
                }, 200);
            }, value.soundTime[i] - (8 * 60 / currentTempo * 1000));
            $('#play-stop').on('click', function () {
                $('#play-start').addClass('active');
                $('#play-stop').removeClass('active');
                clearTimeout(value.soundPlay[i]);
                $(`#${soundNames[index]}-sound`).get(0).pause();
            });
        };
    });
});

// ズレを補正ボタンを押したとき
$('#fix').on('click', function () {
    // 設定したテンポに対して無音の8分音符（ズレの補正先）を作成する
    for (let i = 0; i < 1000; i++) {
        time.push(i * 60 / currentTempo * 500);
    }
    // 音色の数だけ以下の処理を行う
    for (let j = 0; j < sounds.length; j++) {
        // 音を鳴らした回数分だけ以下の処理を行う
        for (let k = 0; k < sounds[j].soundTime.length; k++) {
            // 音を鳴らしたタイミングとズレの補正先の差分を取り、最も0に近いズレの補正先のタイムスタンプを補正版に追加する
            const closest = time.reduce((prev, curr) => {
                return (Math.abs(curr - sounds[j].soundTime[k]) < Math.abs(prev - sounds[j].soundTime[k]) ? curr : prev);
            });
            sounds[j].fixedSoundTime.push(closest);
        }
    }
    alert('Fixing Successed!(Maybe)');
});

// 演奏再生ボタンを押したとき
$('#fixed-play-start').on('click', function () {
    // 演奏停止ボタンを表示する
    $('#fixed-play-start').removeClass('active');
    $('#fixed-play-stop').addClass('active');
    // Kキーが押された回数だけ以下の処理を繰り返す
    sounds.forEach((value, index) => {
        for (let i = 0; i < value.fixedSoundTime.length; i++) {
            value.fixedSoundPlay.push('');
            // メトロノームが8回鳴った後のキック音を再生する
            value.fixedSoundPlay[i] = setTimeout(function () {
                $(`#${soundNames[index]}`).addClass('played');
                $(`#${soundNames[index]}-sound`).get(0).volume = 0.5;
                $(`#${soundNames[index]}-sound`).get(0).currentTime = 0;
                $(`#${soundNames[index]}-sound`).get(0).play();
                $(`#${soundNames[index]}-sound`).get(0).loop = false;
                setTimeout(function () {
                    $(`#${soundNames[index]}`).removeClass('played');
                }, 200);
            }, value.fixedSoundTime[i] - (8 * 60 / currentTempo * 1000) * currentTempo / newTempo);
            $('#fixed-play-stop').on('click', function () {
                $('#fixed-play-start').addClass('active');
                $('#fixed-play-stop').removeClass('active');
                clearTimeout(value.fixedSoundPlay[i]);
                $(`#${soundNames[index]}-sound`).get(0).pause();
            });
        };
    });
});

// 演奏を保存ボタンを押したとき
$('#save').on('click', function () {
    // 保存するデータ（各ドラムパーツのズレを補正したタイムスタンプ）を定義する
    const data = {
        arpData: arp.fixedSoundTime,
        arp2Data: arp2.fixedSoundTime,
        buData: bu.fixedSoundTime,
        chordData: chord.fixedSoundTime,
        cl4Data: cl4.fixedSoundTime,
        dropData: drop.fixedSoundTime,
        dscData: dsc.fixedSoundTime,
        dsdData: dsd.fixedSoundTime,
        kl4Data: kl4.fixedSoundTime,
        kl8Data: kl8.fixedSoundTime,
        kl16Data: kl16.fixedSoundTime,
        pianoData: piano.fixedSoundTime,
        vcdData: vcd.fixedSoundTime,
        clapData: clap.fixedSoundTime,
        crashData: crash.fixedSoundTime,
        iptData: ipt.fixedSoundTime,
        kickData: kick.fixedSoundTime,
        nuData: nu.fixedSoundTime,
        snareData: snare.fixedSoundTime,
        time: serverTimestamp(),
    }
    getDoc(doc(db, 'play', `rec${1}`)).then((document) => {
        // console.log(document.data());
        if (document.data() === undefined) {
            setDoc(doc(db, 'play', `rec${1}`), data);
            alert('Save Successed!');
        } else {
            getDoc(doc(db, 'play', `rec${2}`)).then((document) => {
                // console.log(document.data());
                if (document.data() === undefined) {
                    setDoc(doc(db, 'play', `rec${2}`), data);
                    alert('Save Successed!');
                } else {
                    getDoc(doc(db, 'play', `rec${3}`)).then((document) => {
                        // console.log(document.data());
                        if (document.data() === undefined) {
                            setDoc(doc(db, 'play', `rec${3}`), data);
                            alert('Save Successed!');
                        } else {
                            getDoc(doc(db, 'play', `rec${4}`)).then((document) => {
                                // console.log(document.data());
                                if (document.data() === undefined) {
                                    setDoc(doc(db, 'play', `rec${4}`), data);
                                    alert('Save Successed!');
                                } else {
                                    getDoc(doc(db, 'play', `rec${5}`)).then((document) => {
                                        // console.log(document.data());
                                        if (document.data() === undefined) {
                                            setDoc(doc(db, 'play', `rec${5}`), data);
                                            alert('Save Successed!');
                                        } else {
                                            getDoc(doc(db, 'play', `rec${6}`)).then((document) => {
                                                // console.log(document.data());
                                                if (document.data() === undefined) {
                                                    setDoc(doc(db, 'play', `rec${6}`), data);
                                                    alert('Save Successed!');
                                                } else {
                                                    getDoc(doc(db, 'play', `rec${7}`)).then((document) => {
                                                        // console.log(document.data());
                                                        if (document.data() === undefined) {
                                                            setDoc(doc(db, 'play', `rec${7}`), data);
                                                            alert('Save Successed!');
                                                        } else {
                                                            getDoc(doc(db, 'play', `rec${8}`)).then((document) => {
                                                                // console.log(document.data());
                                                                if (document.data() === undefined) {
                                                                    setDoc(doc(db, 'play', `rec${8}`), data);
                                                                    alert('Save Successed!');
                                                                } else {
                                                                    getDoc(doc(db, 'play', `rec${9}`)).then((document) => {
                                                                        // console.log(document.data());
                                                                        if (document.data() === undefined) {
                                                                            setDoc(doc(db, 'play', `rec${9}`), data);
                                                                            alert('Save Successed!');
                                                                        } else {
                                                                            getDoc(doc(db, 'play', `rec${10}`)).then((document) => {
                                                                                // console.log(document.data());
                                                                                if (document.data() === undefined) {
                                                                                    setDoc(doc(db, 'play', `rec${10}`), data);
                                                                                    alert('Save Successed!');
                                                                                } else {
                                                                                    alert("can't save due to save-count limit!");
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

const q = query(collection(db, "play"), orderBy("time", "asc"));
// 演奏データに追加・削除があった場合
onSnapshot(q, (querySnapshot) => {
    const dataArray = [];
    querySnapshot.docs.forEach(function (doc) {
        const data = {
            id: doc.id,
            data: doc.data(),
        };
        dataArray.push(data);
    });
    const tagArray = [];
    dataArray.forEach(function (data, index) {
        tagArray.push(`<li><div id="${data.id}" class="circle">${data.id}</div></li>`);
    });

    $("#output").html(tagArray);
    dataArray.forEach(function (data, index) {
        $(`#${data.id}`).css('background-color', `hsl(${360 * index / dataArray.length}, 100%, 33%)`)
    });
});

for (let i = 0; i < 10; i++) {
    $('body').on('click', `#rec${i + 1}`, function () {
        if ($('#clear').hasClass('active')) {
            sounds.forEach(value => {
                value.fixedSoundTime.length = 0;
            });
            getDoc(doc(db, 'play', `rec${i + 1}`)).then((doc) => {
                for (const [key, value] of Object.entries(doc.data())) {
                    const sound = sounds.find(s => s.name === key);
                    if (sound === undefined) {
                        console.log('undefinedKey: ' + key);
                    } else {
                        sound.fixedSoundTime = value;
                    }
                }
                alert(`録音ファイル${i + 1}を読み込みました！`);
            });
        } else if ($('#clearing').hasClass('active')) {
            deleteDoc(doc(db, 'play', `rec${i + 1}`)).then(() => {
                alert(`録音ファイル${i + 1}を削除しました！`);
            })
                .catch((error) => {
                    alert(`削除に失敗しました ！(${error})`);
                });
        }
    });

    $('#clear').on('click', function () {
        $('#clear').removeClass('active');
        $('#clearing').addClass('active');
        $('#clearing').on('click', function (e) {
            $('#clear').addClass('active');
            $('#clearing').removeClass('active');
        })
    });
}