
var canvas;
var gl;
var program;
var programa_positionLoc;
var programVBuffer;
var programVColorLoc;
var texcoordBuf;
var texCoordLocation;
var texcoordBuf;
var normalBuffer;
var normalLocation;
var element;
const positionBufferArray = [];
const texcoordBufferArray = [];
const normalBufferArray = [];
var worldLocation;
var worldInverseTransposeLocation;
var cubeWorldViewProjectionLocation;
var vaoArray = []; // Array to store VAOs
var Xtheta = 0;
var Ytheta = 0;
// CAMERA INITIALIZATION
var camPosX = 10;
var camPosY = 10;
var camPosZ = 10;
var camera_matrix = mat4();
var fov = 40;


var numShapesToDraw = 0;
var drawCounts = [];

// TRANSLATE CAMERA 
var translateX = 0;
var translateY = 0;
var translateZ = 0;

// SKYBOX STUFF
var skyboxProgram;
var skyboxa_positionLoc;
var skyboxu_skyboxLoc;
var skyboxu_viewDirectionProjectionInverseLoc;
var skyboxBuffer;
var skyboxTexture;
var skyboxVAOarray = [];

var quadVertices = [
    -1, -1, 
    1, -1, 
    -1,  1, 
    -1,  1,
    1, -1,
    1,  1,
  ];

var modelTexture;

window.onload = async function init() {
  
  canvas = document.getElementById( "gl-canvas" ); 
  gl = WebGLUtils.setupWebGL( canvas );
  if( !gl ) { alert( "WebGL is not available" ); }
  gl.viewport( 0, 0, canvas.width, canvas.height );


  const response = await fetch('models/amongus.obj'); 
  const text = await response.text();
  const OBJdata = parseOBJ(text);
  console.log(OBJdata);

  eventListeners();


  // initShaders
  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  skyboxProgram = initShaders( gl, "skybox-vertex-shader", "skybox-fragment-shader" );

  // Attribute locations
  programa_positionLoc = gl.getAttribLocation( program, "a_position" );
  texCoordLocation = gl.getAttribLocation( program, "texCoord" );
  normalLocation = gl.getAttribLocation( program, "a_normal" );

  skyboxa_positionLoc = gl.getAttribLocation( skyboxProgram, "a_position" );


  // Uniform locations
  uTextureLoc = gl.getUniformLocation(program, "u_texture");
  worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  cubeWorldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");

  skyboxu_skyboxLoc = gl.getUniformLocation(skyboxProgram, "u_skybox");
  skyboxu_viewDirectionProjectionInverseLoc = gl.getUniformLocation(skyboxProgram, "u_viewDirectionProjectionInverse");


  populateskyboxVAO().then(() => {
    populateModelVAO(OBJdata);
  }).catch((error) => {
    console.error("Error in populateskyboxVAOs",error);
  });
  
}

function render() {
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);    
    gl.cullFace(gl.BACK);
    gl.clearColor( 1, 0.5, 0.5, 1 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    gl.clear(gl.DEPTH_BUFFER_BIT);
    drawModel();
    
    drawSkybox();

}


async function populateModelVAO(OBJdata){
  console.log("Starting model texture creation...");
  const modelTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, modelTexture);

  let modelTexturePromise = new Promise((resolve, reject) => {

      const image = new Image();
      image.src = 'Plastic_4K_Diffuse.jpg';

      image.onload = () => {
          console.log(`Model modelTexture loaded from: Plastic_4K_Diffuse.jpg`);
          gl.bindTexture(gl.TEXTURE_2D, modelTexture);
          const width = 4096;
          const height = 4096;
          const format = gl.RGBA;
          const type = gl.UNSIGNED_BYTE;
          image.addEventListener('load', () => {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, modelTexture);
            gl.texImage2D(gl.TEXTURE_20, 0, gl.RGBA, format, type, image);
            gl.generateMipmap(gl.TEXTURE_2D);


          // Resolving the promise to indicate success
          resolve(modelTexture); // you can pass the modelTexture if you'd like to use it later
      });
    }
      image.onerror = () => {
          // Rejecting the promise to indicate an error
          reject(new Error("Error loading model modelTexture from: Plastic_4K_Diffuse.jpg"));
      };
  });



  modelTexturePromise.then(() => {
    for (const element of OBJdata.geometries) {
    // Create and bind VAO
    let tempVAO = gl.createVertexArray();
    gl.bindVertexArray(tempVAO);
    // Create buffers
    const positionBuffer = gl.createBuffer();
    const texcoordBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();



    // Populate Position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(element.data.position), gl.STATIC_DRAW); 
    gl.enableVertexAttribArray( programa_positionLoc );
    gl.vertexAttribPointer(programa_positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

          // Checking if texture coordinates do not exist
          let texcoords = element.data.texcoord;
          // If texture coordinates don't exist or are empty, create default (0,0) coords
          if (!texcoords || texcoords.length === 0) {
            console.log("No texture coordinates found");
            const numVertices = element.data.position.length / 3;
            texcoords = new Array(numVertices * 2).fill(0); // Create an array of size numVertices*2 and fill it with zeros
          }
    
    // Populate Texture buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    gl.enableVertexAttribArray( texCoordLocation );
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Populate Normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(element.data.normal), gl.STATIC_DRAW);
    gl.enableVertexAttribArray( normalLocation );
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Push the amount of shapes to draw into the drawCounts array
    drawCounts.push(element.data.position.length/3 );
    
    // Push the VAO into the vaoArray
    vaoArray.push(tempVAO);

    // gl.bindVertexArray(null);
  }
}).catch(error => {
    console.error("There was an error loading one or more images", error);
  });

}

async function populateskyboxVAO(){
    try {
      console.log("Starting skybox texture creation...");
      // Create Skybox texture
      skyboxTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

      // Defining the faces of the cube map
      const faceInfos = [
        {
          target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
          src: 'right.png',
        },
        {
          target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
          src: 'left.png',
        },
        {
          target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
          src: 'top.png',
        },
        {
          target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
          src: 'bottom.png',
        },
        {
          target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
          src: 'front.png',
        },
        {
          target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
          src: 'back.png',
        },
      ];
      let imageLoadPromises = faceInfos.map((faceInfo) => {
        return new Promise((resolve, reject) => {
            const { target, src } = faceInfo;
            console.log(`Starting to load image for target: ${target}, src: ${src}`);
            
            const level = 0;
            const internalFormat = gl.RGBA;
            const width = 512;
            const height = 512;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            
            // Setup each face so it's immediately renderable
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
            
            // Asynchronously load an image
            const image = new Image();
            image.src = src;
            image.onload = () => {
              console.log(`Image loaded for target: ${target}`);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
              gl.texImage2D(target, level, internalFormat, format, type, image);
              resolve();
            };
            image.onerror = reject;
        });
    });
    // Use await here to wait for all imageLoadPromises to finish
    await Promise.all(imageLoadPromises);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    console.log("Mipmaps generated for skybox texture");

    let skyboxVAO = gl.createVertexArray();
    gl.bindVertexArray(skyboxVAO);

    // Create skybox buffer
    skyboxBuffer = gl.createBuffer();

    // Populate skybox buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadVertices), gl.STATIC_DRAW);

    // Enable vertex attribute array for position
    gl.enableVertexAttribArray(skyboxa_positionLoc);
    gl.vertexAttribPointer(skyboxa_positionLoc, 2, gl.FLOAT, false, 0, 0);

    skyboxVAOarray.push(skyboxVAO);
    gl.bindVertexArray(null);

    } catch(error) {
      console.error("There was an error in populateskyboxVAOs", error);
      throw(error);
    }
}

function drawSkybox() {
  console.log("Trying to draw skybox");
  gl.useProgram(skyboxProgram);
  gl.bindVertexArray(skyboxVAOarray[0]);

  gl.enableVertexAttribArray(skyboxa_positionLoc);
  gl.activeTexture(gl.TEXTURE0);

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  gl.uniform1i(skyboxu_skyboxLoc, 0);

  modelmatrix = mat4();
  viewMatrix = inverse(camera_matrix);
  projectionMatrix = perspective(fov, canvas.width / canvas.height, 0.01, 10000.0);

  // We only care about direciton so remove the translation
  viewDirectionMatrix = mat4(
    viewMatrix[0][0], viewMatrix[0][1], viewMatrix[0][2], 0,
    viewMatrix[1][0], viewMatrix[1][1], viewMatrix[1][2], 0,
    viewMatrix[2][0], viewMatrix[2][1], viewMatrix[2][2], 0,
    0, 0, 0, 1
  );

  // Take the inverse of the view direction matrix to get the direction the camera is looking 
  viewDirectionProjectionMatrix = mult(projectionMatrix, viewDirectionMatrix);
  viewDirectionProjectionInverseMatrix = inverse(viewDirectionProjectionMatrix);
  gl.uniformMatrix4fv(skyboxu_viewDirectionProjectionInverseLoc, false, flatten(viewDirectionProjectionInverseMatrix));

  gl.depthFunc(gl.LEQUAL);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disableVertexAttribArray(skyboxa_positionLoc);
  gl.bindVertexArray(null);
}

function drawModel(){
  console.log("Trying to draw model");
  gl.useProgram(program);

  viewMatrix = inverse(camera_matrix);


  projectionMatrix = perspective(fov, canvas.width / canvas.height, 0.01, 1000.0);

  for(let i = 0; i < vaoArray.length; i++) {
    console.log(vaoArray.length);
    gl.bindVertexArray(vaoArray[i]); // Bind VAO for current shape wanting to be drawn
    gl.enableVertexAttribArray( programa_positionLoc );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, modelTexture);
    gl.uniform1i(uTextureLoc, 0);
    modelmatrix = mat4(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
      );
    modelmatrix = scalem(0.01, 0.01, 0.01);
    let cubeWorldViewProjection = mat4();
    cubeWorldViewProjection = mult(mult(projectionMatrix, viewMatrix), modelmatrix);
    gl.uniformMatrix4fv(cubeWorldViewProjectionLocation, false, flatten(cubeWorldViewProjection));

    var worldInverseMatrix = inverse(modelmatrix);
    var worldInverseTransposeMatrix = transpose(worldInverseMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, flatten(worldInverseTransposeMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, drawCounts[i]);
    gl.disableVertexAttribArray( programa_positionLoc );
    gl.bindVertexArray(null);
  }

}

function rotateCamera() {
  const x = camera_matrix[0][3]
  const y = camera_matrix[1][3]
  const z = camera_matrix[2][3]
  if (Ytheta) {
      let rotationMatrixY = mat4();

      rotationMatrixY = mult(rotate(Ytheta, [1, 0, 0]), rotationMatrixY);

      camera_matrix = mult(camera_matrix, rotationMatrixY);
      Ytheta = 0;
  }
  if (Xtheta) {
      let rotationMatrixX = mat4();
      rotationMatrixX = mult(rotate(Xtheta, [0, 1, 0]), rotationMatrixX);
      camera_matrix = mult(rotationMatrixX,camera_matrix);
      Xtheta = 0;
  }
  camera_matrix[0][3] = x;
  camera_matrix[1][3] = y;
  camera_matrix[2][3] = z;
}

function translateCamera(translation) {
  let translationMatrix = translate(translation);
  camera_matrix = mult(camera_matrix, translationMatrix);
}


function eventListeners(){
  document.addEventListener("keydown", function(event) {
    if (event.key === "d") {
        translateCamera([1, 0, 0]);
        render();
    } else if (event.key === "a") {
        translateCamera([-1, 0, 0]);
        render();
    } 
});

  document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowDown") {
        translateCamera([0, -1, 0]);
        render();
    } else if (event.key === "ArrowUp") {
        translateCamera([0, 1, 0]);
        render();
    } 
});
  document.addEventListener("keydown", function(event) {
  if (event.key === "w") {
      translateCamera([0, 0, -1]);
      render();
  } else if (event.key === "s") {
      translateCamera([0, 0, 1]);
      render();
  } 
});

  canvas.addEventListener("mousemove", function(event) {
  if (event.buttons === 1) { 
      Xtheta -= event.movementX/5; 
      Ytheta -= event.movementY/5; 
      rotateCamera();
      render();
  }
});
}