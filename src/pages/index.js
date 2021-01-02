import React, { useState, useEffect, useRef } from 'react';
import gsap from "gsap";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import logo from '../images/logo.png';
import stepOne from '../images/step_1.png';
import stepTwo from '../images/step_2.png';
import InFrame from '../images/In_frame.png';
import OutFrame from '../images/out_frame.png';
import SaveYour from '../images/saveyourGif.png';
import crossBT from '../images/crossbt.png';
import videoIntro from '../images/videointro.mp4';
import arrowOptions from '../images/arrow_options.gif';
import pleaseWait from '../images/pleasewait.gif';
import {Helmet} from "react-helmet";
import getBlobDuration from 'get-blob-duration';//Known issue with Chrome, fix: https://www.npmjs.com/package/get-blob-duration

const ffmpeg = createFFmpeg({ log: false });


//TODO:
//-Do an intro with all setps. maybe sync with the intro for the buttons.
//change color of buttons/interactivity.
//Redo the draw text.
//white hover in botoes

let mediaRecorder;
let recordedBlobs;

export default function Home() {
  const videoRef = useRef(null);
  const captureScreenBT = useRef(null);
  const thumbIn = useRef(null);
  const thumbOut = useRef(null);
  const cueIn = useRef();
  const cueOut = useRef(null);
  const sliderIn = useRef(null);
  const sliderOut = useRef(null);
  const arrowRef = useRef(null);
  const filesFly = useRef(null);
  const uploadFileBT = useRef(null);

  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState(videoIntro);
  const [gif, setGif ] = useState();
  const [currentTime, setCurrentTime] = useState(0);
  const [percentageTime, setPercentageTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [inCut, setInCut] = useState(10);
  const [outCut, setOutCut] = useState(80);
  const [recording, setRecording] = useState(false);

  const [userInteraction, setUserInteraction] = useState(false);
  const [gifpage, setgifpage] = useState(false);




  useEffect(() => {
    const onMouseMove=(e=>{
      if(e.clientY>window.innerHeight*.5){
gsap.to(arrowRef.current, {x: 0, y: 0, rotation: 40});
}else{
  gsap.to(arrowRef.current, {x: 0, y: 0, rotation: -40});
}
    })
    window.addEventListener('mousemove', onMouseMove)
}, []);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  }

  useEffect(()=>{
    load();
    console.log("loaded!")
    }, [])

  const percent2int =(inPercentage)=>{
    // if(videoRef.current.duration===Infinity)
    let inInt = inPercentage/100 * duration;
    console.warn({'inInt':inPercentage, 'current Time': duration})
    return parseFloat(inInt);
  }
  const int2percent =(inInt)=>{
    let outPercentage = inInt*100/ videoRef.current.duration;
    return parseFloat(outPercentage.toFixed(2));
  }

  const convertToGif = async () => {
    setgifpage(true);
    //WASM has its own file system, so you need to send your file to its own file system and then work on the file
    ffmpeg.FS('writeFile','file.mp4', await fetchFile(video));
    let inGif = percent2int(inCut)
    let outGif = percent2int(outCut)
    var length= outGif-inGif;
    
    //-i = input | -t = desired lentgh of the video | -ss = offset (start time)
    await ffmpeg.run('-i', 'file.mp4', '-t', length.toString(), '-ss', inGif.toString(), '-f', 'gif', 'out.gif');
    const data = ffmpeg.FS('readFile', 'out.gif');
    const url = URL.createObjectURL(new Blob([data.buffer], {type: 'image/gif'}))
    setGif(url);
  }

  function handleInSlider(e){
    if(video){
      e.target.value<outCut? setInCut(e.target.value):e.target.value = outCut;
      console.log(typeof(e.target.value), parseFloat(e.target.value), parseFloat(percent2int(e.target.value)))
      thumbIn.current.currentTime=parseFloat(percent2int(e.target.value));
    }
  }
  
  function handleOutSlider(e){
    e.target.value>inCut? setOutCut(e.target.value):e.target.value = inCut;
    thumbOut.current.currentTime=percent2int(e.target.value);
  }

  function UpdateTime(){
    if(!recording){
      // console.log("updatetime", videoRef.current.currentTime, percent2int(inCut), percent2int(outCut))
      if(videoRef.current.currentTime<=percent2int(inCut)){
        setCurrentTime(percent2int(inCut))
        videoRef.current.currentTime = currentTime;
      } else if(videoRef.current.currentTime>=percent2int(outCut)){
        videoRef.current.currentTime = percent2int(inCut);
      }else{
        setCurrentTime(videoRef.current.currentTime)
      }
      setPercentageTime(int2percent(videoRef.current.currentTime))
    }
  }



  // captureScreenBT
  function captureScreen(){
    navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'window'
      }
    })
      .then(handleSuccess, handleError);
  }

  function handleError(error) {
   console.log(':('); 
  }

  function handleSuccess(stream) {
    // captureScreenBT.disabled = true;
    videoRef.current.srcObject = stream;
    // setVideo(stream)
    startRecording();
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      console.log(typeof(stream));
      // videoRef.current.srcObject = null;
      //stopRecording();
      setInCut(0)
      setCurrentTime(0)
      setOutCut(100)
      videoRef.current.srcObject = null;
      mediaRecorder.stop();
      setRecording(false); 
      setUserInteraction(true);
      setTimeout(() => {
        const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
        // recordedVideo.src = null;
        // recordedVideo.srcObject = null;
        setVideo(window.URL.createObjectURL(superBuffer));
        videoRef.current.controls = false;
        videoRef.current.play();
        (async function() {
          const duration = await getBlobDuration(superBuffer)
          console.warn(duration + ' seconds')
          setDuration(duration);
        })()
      }, 1500);

      
       // captureScreenBT.disabled = false;
    });
  }

  function HoverUploadbt(){
    gsap.to(uploadFileBT.current, {x: 0, y: 10, rotation: 10, scale: 1.1});
    gsap.to(filesFly.current, {x: 0, y: 0, rotation: -20, scale: 1.4});
  }
  function LeaveUploadbt(){
    gsap.to(uploadFileBT.current, {x: 0, y: 0, rotation: 0, scale: 1.0});
    gsap.to(filesFly.current, {x: 0, y: 0, rotation: 0, scale: 1.0});
  }

  function HoverCapturebt(){
    
    gsap.to(captureScreenBT.current, {x: 0, y: 0, rotation: 10, scale: 1.1});
    // gsap.to(filesFly.current, {x: 0, y: 0, rotation: -20, scale: 1.4});
  }

  function LeaveCapturebt(){
    gsap.to(captureScreenBT.current, {x: 0, y: 0, rotation: 0, scale: 1.0});

  }

  function startRecording() {
    setRecording(true);
    recordedBlobs = [];
    let options = {mimeType: 'video/webm;codecs=vp9,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm;codecs=vp8,opus'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: 'video/webm'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = {mimeType: ''};
        }
      }
    }
    try {
      mediaRecorder = new MediaRecorder(videoRef.current.srcObject, options);//{mimeType: 'video/webm'}
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
      // errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
      return;
    }
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
  }

  function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  }

  function closeGifView(){
    setGif('');
    setgifpage(false);
  }

  function videoUploaded(e){
    setVideo(URL.createObjectURL(e.target.files?.item(0)))
    setUserInteraction(true);
  }
  function stopRecording(){
    setInCut(0)
    setCurrentTime(0)
    setOutCut(100)
    videoRef.current.srcObject = null;
    mediaRecorder.stop();
    setRecording(false);
    setUserInteraction(true);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = "GifTape.cc";
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer && window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-Q7NM67VBX5');
    }
  })


  return ready ? (
<div className="App">
    <Helmet>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Q7NM67VBX5"></script>
    </Helmet>
    <div className="GifView" style={gifpage? {display:'block'}:{display:'none'}}>
    <img alt="saveTitle" className="saveyourTitle" src={SaveYour}/>
    <img  alt="closeWindow" className="crossBT" onClick={closeGifView} src={crossBT}/>
      {gif && <img  alt="YourGif" className="yourgif" src={gif}/>}
      {gifpage && <img  alt="YourGif" className="pleaseWait" src={pleaseWait}/>}
    </div>
    
    <div className='wrapper'>
    <div ref={arrowRef} className='arrowOptions'><img src={arrowOptions}/></div>
    <div className='logo'><img  alt="Logo GIFTAPE" src={logo}/></div>
    <div className='stepOne'><img  alt="stepOne" src={stepOne}/></div>
    <div className='stepTwo'><img  alt="steptwo" src={stepTwo}/></div>
    <div className='rays'></div>
    {/* <button onClick={(e)=>stopRecording()}>STOP</button> */}
    <div className='recordScreenIcon'></div>
    <div ref={captureScreenBT} onMouseOver={HoverCapturebt} onMouseLeave={LeaveCapturebt} onClick={(e)=>captureScreen()} className='recordScreenText'></div>


    <div className='filesFly' ref={filesFly}></div>
    <div className='uploadFile' ref={uploadFileBT} onMouseLeave={LeaveUploadbt} onMouseOver={HoverUploadbt}>
    <input type="file" onChange={(e)=> videoUploaded(e)} />   
    </div>

    <div className='convertBT' style={userInteraction? {display:'block'}:{display:'none'}} onClick={convertToGif}></div>
    {/* <button className='ConvertBT' onClick={convertToGif}>Convert</button> */}
    {/* <button onClick={(e)=>setInCut(videoRef.current.currentTime)}>Set In</button>
    <button onClick={(e)=>setOutCut(videoRef.current.currentTime)}>Set Out</button>
     */}


    <div className="TVFrame"></div>
    <div className="TVbox">
    {video && <div className="CurrentTime"  style={{left: percentageTime+"%"}}></div>}
    <div className="timeline" style={{left:inCut+"%", width:outCut-inCut+"%"}}></div>
    {video && <video className="videoPlayer" onEnded={(e)=>{videoRef.current.currentTime=percent2int(inCut)}} onTimeUpdate={UpdateTime} onPlay={()=> setDuration(videoRef.current.duration)}  ref={videoRef} playsInline autoPlay={true} loop muted src={video}></video>}
    {/* {video && <video className="videoPlayer" onTimeUpdate={UpdateTime} onPlay={()=> setDuration(videoRef.current.duration)}  ref={videoRef} playsInline autoPlay={true} loop muted src={video}></video>} */}
    </div>

        <div className="sliders">
          <div className='sliderIn'>
            <input className="InSlider" ref={sliderIn} value={inCut} onChange={(e)=>handleInSlider(e)} min="0" max="100" step="1" type="range" />
          </div>
          <div className='sliderOut'>
            <input className="OutSlider" ref={sliderOut} value={outCut} onChange={(e)=>handleOutSlider(e)} min="0" max="100" step="1" type="range" />
          </div>
        </div>


          <div className="FilmStrip">
            <div className="cue" ref={cueIn} style={{left:inCut+"%"}}>
            <img alt="frame" className="Frame" src={InFrame}/>
              {video && <video className="video-js" ref={thumbIn} playsInline src={video}></video>}
            </div>
            <div className="cue" ref={cueOut} style={{left:outCut+"%"}}>
            <img  alt="frame" className="Frame" src={OutFrame}/>

              {video && <video className="video-js" ref={thumbOut} playsInline src={video}></video>}
            </div>
            <div className="InTimeline"  style={{width:inCut+"%"}}></div>
            <div className="OutTimeline"  style={{width:100-outCut+"%"}}></div>
          </div>
          
        

    </div>
</div>
) : ( 
<div className="GifView" style={{display:'block'}}>
<p>Loading...</p> 
</div>
);
}
