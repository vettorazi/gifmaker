import React, { useState, useEffect, useRef } from 'react';
import gsap from "gsap";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import logo from '../images/logo.png';
import stepOne from '../images/step_1.png';
import stepTwo from '../images/step_2.png';
import stepThree from '../images/step_3.png';
import InFrame from '../images/In_frame.png';
import OutFrame from '../images/out_frame.png';
import SaveYour from '../images/saveyourGif.png';
import crossBT from '../images/crossbt.png';
import videoIntro from '../images/videointro.mp4';
import arrowOptions from '../images/arrow_options.png';

const ffmpeg = createFFmpeg({ log: false });

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
  const [duration, setDuration] = useState(null);
  const [inCut, setInCut] = useState(10);
  const [outCut, setOutCut] = useState(80);
  const [recording, setRecording] = useState(false);



  useEffect(() => {
         
    // gsap.from(arrowRef.current, {
    //   rotation: 180,
    //     ease: 'none',
    //     delay: 1
    // });
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
    // sliderOut.current.value=100;
    }, [])

  const percent2int =(inPercentage)=>{
    let inInt = inPercentage/100 * videoRef.current.duration;
    return inInt.toFixed(2);
  }
  const int2percent =(inInt)=>{
    let outPercentage = inInt*100/ videoRef.current.duration;
    return outPercentage.toFixed(2);
  }

  const convertToGif = async () => {
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
      thumbIn.current.currentTime=percent2int(e.target.value);
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
      setTimeout(() => {
        const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
        // recordedVideo.src = null;
        // recordedVideo.srcObject = null;
        setVideo(window.URL.createObjectURL(superBuffer));
        videoRef.current.controls = true;
        videoRef.current.play();
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
  }

  function stopRecording(){
    setInCut(0)
    setCurrentTime(0)
    setOutCut(100)
    videoRef.current.srcObject = null;
    mediaRecorder.stop();
    setRecording(false);
  }
  return ready ? (
<div className="App">
    <div className="GifView" style={gif? {display:'block'}:{display:'none'}}>
    <img alt="saveTitle" className="saveyourTitle" src={SaveYour}/>
    <img  alt="closeWindow" className="crossBT" onClick={closeGifView} src={crossBT}/>
      {gif && <img  alt="YourGif" className="yourgif" src={gif}/>}
      {gif && <h3>result</h3>}
    </div>
    
    <div className='wrapper'>
    <div ref={arrowRef} className='arrowOptions'><img src={arrowOptions}/></div>
    <div className='logo'><img  alt="Logo GIFTAPE" src={logo}/></div>
    <div className='stepOne'><img  alt="stepOne" src={stepOne}/></div>
    <div className='stepTwo'><img  alt="steptwo" src={stepTwo}/></div>
    <div className='stepThree'><img  alt="stepthree" src={stepThree}/></div>
    <div className='rays'></div>
    {/* <button onClick={(e)=>stopRecording()}>STOP</button> */}
    <div className='recordScreenIcon'></div>
    <div ref={captureScreenBT} onMouseOver={HoverCapturebt} onMouseLeave={LeaveCapturebt} onClick={(e)=>captureScreen()} className='recordScreenText'></div>


    <div className='filesFly' ref={filesFly}></div>
    <div className='uploadFile' ref={uploadFileBT} onMouseLeave={LeaveUploadbt} onMouseOver={HoverUploadbt}>
    <input type="file" onChange={(e)=> setVideo(URL.createObjectURL(e.target.files?.item(0)))} />   
    </div>

    <button className='ConvertBT' onClick={convertToGif}>Convert</button>
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
) : ( <p>Loading...</p> );
}
