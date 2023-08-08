function createModel(vao, vertLen,diff,tex,matrix = mat4(),velo =vec3()){
    return {
        modelVao : vao,
    modelMatrix : matrix,
    modelLen : vertLen,
    modelVelo : velo,
    diffuseColor : diff,
    texture:tex,
    }
}