"use strict";

var canvas;

var gl;

var numVertices  = 36;

var numChecks = 8;

var program;

var c;

var flag = true;

var radius = 4.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var modelViewMatrix, projectionMatrix; 
var modelViewMatrixLoc, projectionMatrixLoc;

var eye = vec3(0.0, 0.0, 3.0);  
const at = vec3(0.0, 0.0, 0.0); 
const up = vec3(0.0, 1.0, 0.0); 

var texSize = 256;

var texture1, texture2;
var texCoordsArray = [];

var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            if(patchx%2) c = 255;
            else c = 0;
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchy%2) c = 255;
            else c = 0;
            image2[4*i*texSize+4*j] = c;
            image2[4*i*texSize+4*j+1] = c;
            image2[4*i*texSize+4*j+2] = c;
            image2[4*i*texSize+4*j+3] = 255;
           }
    }

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

var phongShader = true;
var gouraudProgram;
var phongProgram;

var ambientProduct,ambientProductLoc;
var diffuseProduct,diffuseProductLoc;
var specularProduct,specularProductLoc;

var change_direction = 1; 

var cameraTransformationMatrix;

var lightPosition = vec4(0.8, 0.8, 0.8, 1.0 );
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0 ); 
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 ); 
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 ); 

var materialAmbient = vec4(0.1745, 0.01175, 0.01175, 1.0);
var materialDiffuse = vec4(0.61424,0.04136,0.04136, 1.0);
var materialSpecular = vec4(0.727811,0.626959,0.626959, 1.0);
var materialShininess = 400;

var lightPositionLoc;
var shininessLoc;

var left = -1.0; 
var right = 1.0; 
var ytop = 1.0; 
var bottom = -1.0; 


var scaleVector = [1.0,1.0,1.0]; 
var translateVector = [0.0, 0.0, 0.0]; 

var theta = [45.0, 45.0, 45.0];
var thetaLoc;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var near = 0.3; 
var far = 5.0; 

var  fovy = 45.0;  
var  aspect = 1.0; 

var pointsArray = [];
var normalsArray = []; 


var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];



function quad(a, b, c, d) {
     var t1 = subtract(vertices[b], vertices[a]); 
     var t2 = subtract(vertices[c], vertices[b]); 
     var normal = cross(t1, t2); 
     var normal = vec3(normal); 
    
     pointsArray.push(vertices[a]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[a]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     normalsArray.push(normal); 
     texCoordsArray.push(texCoord[3]);
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    //
    phongProgram = initShaders(gl, "vertex-shader-phong", "fragment-shader-phong");
    gouraudProgram = initShaders(gl, "vertex-shader-gouraud", "fragment-shader-gouraud");
    

    colorCube();

    var nBuffer = gl.createBuffer(); 
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer ); 
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW ); 
    
    var vNormal = gl.getAttribLocation( phongProgram, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    
    var vNormal = gl.getAttribLocation( gouraudProgram, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    
    // gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 ); 
    
    // gl.enableVertexAttribArray( vNormal ); 

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( phongProgram, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var vPosition = gl.getAttribLocation( gouraudProgram, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    // gl.enableVertexAttribArray( vPosition );
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation(phongProgram, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    configureTexture();

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation(phongProgram, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation(phongProgram, "Tex1"), 1);


    var t2Buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, t2Buffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation(gouraudProgram, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation(gouraudProgram, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation(gouraudProgram, "Tex1"), 1);

    document.getElementById("rotateX").onclick = function(){axis = xAxis;};

    document.getElementById("rotateY").onclick = function(){axis = yAxis;};

    document.getElementById("rotateZ").onclick = function(){axis = zAxis;};

    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    document.getElementById("changeR").onclick = function(){change_direction = - change_direction;}; 

    document.getElementById("scalingSlider").oninput = function(){
        scaleVector = [event.target.value, event.target.value, event.target.value]; 
    }  

    document.getElementById("translationXSlider").oninput = function(){
        translateVector[xAxis] = event.target.value;
    } 

    document.getElementById("translationYSlider").oninput = function(){
        translateVector[yAxis] = event.target.value;
    } 

    document.getElementById("translationZSlider").oninput = function(){
        translateVector[zAxis] = event.target.value;
    } 
    
    document.getElementById("nearSlider").oninput = function(event){ 
        near = event.target.value;
    }
    
    document.getElementById("farSlider").oninput = function(event){ 
        far = event.target.value;
    }
    document.getElementById("fovySlider").oninput = function(event){ 
        fovy = event.target.value;
    }
    document.getElementById("aspectSlider").oninput = function(event){ 
        aspect = event.target.value;
    }
    
    document.getElementById("lightButton").onclick = function(event){
     
     if (phongShader){
        document.getElementById("currentShading").innerHTML = "(current: Phong Shading)";
        phongShader = false
     }
     else {
        document.getElementById("currentShading").innerHTML = "(current: Gouraud Shading)";
        phongShader = true
     }

    };
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);


    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0 * change_direction; 
    
    function renderScene(drawX, drawY, drawWidth, drawHeight,projectionMatrix) {
      gl.enable(gl.SCISSOR_TEST);
      gl.viewport(drawX, drawY, drawWidth, drawHeight);
      gl.scissor(drawX, drawY, drawWidth, drawHeight);
      
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if (phongShader) {
            gl.useProgram( phongProgram );
            
            modelViewMatrixLoc = gl.getUniformLocation( phongProgram, "modelViewMatrix" );
            projectionMatrixLoc = gl.getUniformLocation( phongProgram, "projectionMatrix" );
            
            ambientProductLoc = gl.getUniformLocation( phongProgram, "ambientProduct" );
            diffuseProductLoc = gl.getUniformLocation( phongProgram, "diffuseProduct" );
            specularProductLoc = gl.getUniformLocation( phongProgram, "specularProduct" );
            
            lightPositionLoc = gl.getUniformLocation(phongProgram, "lightPosition");
            
            shininessLoc = gl.getUniformLocation(phongProgram, "shininess")
        } else {
            gl.useProgram( gouraudProgram );
            
            modelViewMatrixLoc = gl.getUniformLocation( gouraudProgram, "modelViewMatrix" );
            projectionMatrixLoc = gl.getUniformLocation( gouraudProgram, "projectionMatrix" );
            
            ambientProductLoc = gl.getUniformLocation( gouraudProgram, "ambientProduct" );
            diffuseProductLoc = gl.getUniformLocation( gouraudProgram, "diffuseProduct" );
            specularProductLoc = gl.getUniformLocation( gouraudProgram, "specularProduct" );
            
            lightPositionLoc = gl.getUniformLocation(gouraudProgram, "lightPosition");
            
            shininessLoc = gl.getUniformLocation(gouraudProgram, "shininess")
        }

       
        cameraTransformationMatrix = lookAt(eye, at , up); // Returns a view matrix
        cameraTransformationMatrix = mult(cameraTransformationMatrix,translate(translateVector));
        cameraTransformationMatrix = mult(cameraTransformationMatrix,scalem(scaleVector)); 
        cameraTransformationMatrix = mult(cameraTransformationMatrix,rotateZ(-theta[zAxis])); 
        cameraTransformationMatrix = mult(cameraTransformationMatrix,rotateY(-theta[yAxis])); 
        cameraTransformationMatrix = mult(cameraTransformationMatrix,rotateX(-theta[xAxis])); 
        

        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(cameraTransformationMatrix) );
        gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
        gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
        gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
        gl.uniform4fv(specularProductLoc, flatten(specularProduct));
        gl.uniform4fv(lightPositionLoc, flatten(lightPosition) );
        gl.uniform1f(shininessLoc, materialShininess);

        gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    }
    
    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const displayWidth = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;

    // draw orthogonal projection
    { projectionMatrix = ortho(left, right, bottom, ytop, near, far);
      // gl.clearColor(1.0, 0.1, 0.1, 1.0);
      renderScene(0, 0, width / 2, height,projectionMatrix);
    }
    
    // draw perspective projection
    {
      projectionMatrix = perspective(fovy, aspect, near, far);
      // gl.clearColor(0.2, 0.2, 0.2, 1.0 );
      renderScene(width / 2, 0, width / 2, height,projectionMatrix);
    }

    requestAnimFrame(render);
}
