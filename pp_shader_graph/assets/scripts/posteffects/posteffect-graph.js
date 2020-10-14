// --------------- POST EFFECT DEFINITION --------------- //
Object.assign(pc, function () {

    /**
     * @class
     * @name pc.GraphEffect
     * @classdesc Implements the GraphEffect post processing effect.
     * @description Creates new instance of the post effect.
     * @augments pc.PostEffect
     * @param {pc.GraphicsDevice} graphicsDevice - The graphics device of the application.
     * @param {pc.NodeMaterial} nodeMaterial - The graphics device of the application.
     * @property {number} maxBlur The maximum amount of blurring. Ranges from 0 to 1.
     * @property {number} aperture Bigger values create a shallower depth of field.
     * @property {number} focus Controls the focus of the effect.
     * @property {number} aspect Controls the blurring effect.
     */
    var GraphEffect = function (graphicsDevice, nodeMaterial) {
        pc.PostEffect.call(this, graphicsDevice);

        this.needsDepthBuffer = true;

        this.ppPorts = nodeMaterial.graphData.ioPorts.filter(function (ioPort) {
            return (ioPort.name.startsWith('OUT_') && ioPort.name.endsWith('RT'));
        });

        this.ppShaders = [];
        this.ppTargets = [];
        this.ppUniformNames = [];
        this.ppOrder = [];

        this.ppPorts.forEach((ppPort, pIndex) => {
            // var ppParams = ppPort.valueString.split(',');
//            this.ppOrder[pIndex] = parseInt(ppParams[0], 10);
            this.ppOrder[pIndex] = ppPort.valueW;

            if (this.ppOrder[pIndex] >= 0 && this.ppOrder[pIndex] < this.ppPorts.length && !this.ppShaders[this.ppOrder[pIndex]])
            {
                var options = {
                    skin: false,
                    shaderGraph: nodeMaterial,
                    pass: 'PP',
                    previewPort: { index: -1, name: ppPort.name },
                    _debugFlag: true
                };
                var shaderDefinition = pc.programlib.node.createShaderDefinition(graphicsDevice, options);
                this.ppShaders[this.ppOrder[pIndex]] = new pc.Shader(graphicsDevice, shaderDefinition);

                var width = graphicsDevice.width * ppPort.valueX;
                var height = graphicsDevice.height * ppPort.valueY;
                var colorBuffer = new pc.Texture(graphicsDevice, {
                    format: pc.PIXELFORMAT_R8_G8_B8_A8,
                    width: width,
                    height: height
                });
                colorBuffer.minFilter = pc.FILTER_LINEAR;
                colorBuffer.magFilter = pc.FILTER_LINEAR;
                colorBuffer.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
                colorBuffer.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
                colorBuffer.name = ppPort.name + '_' + this.ppOrder[pIndex];
                this.ppTargets[this.ppOrder[pIndex]] = new pc.RenderTarget(graphicsDevice, colorBuffer, { depth: false });
                this.ppUniformNames[this.ppOrder[pIndex]] = 'IN_' + ppPort.name.substr(4) + '_' + nodeMaterial.id;
            }

        });

        var options = {
            skin: false,
            shaderGraph: nodeMaterial,
            pass: 'PP'
        };

        var shaderDefinition = pc.programlib.node.createShaderDefinition(graphicsDevice, options);

        this.shader = new pc.Shader(graphicsDevice, shaderDefinition);

        nodeMaterial.updateUniforms();

        this.nodeMaterial = nodeMaterial;
    };

    GraphEffect.prototype = Object.create(pc.PostEffect.prototype);
    GraphEffect.prototype.constructor = GraphEffect;

    Object.assign(GraphEffect.prototype, {
        render: function (inputTarget, outputTarget, rect) {
            var device = this.device;
            var scope = device.scope;

            Object.keys(this.nodeMaterial.parameters).forEach((key) => {
                if (key.endsWith('RT'))
                {
                    //done later
                }
                else
                {
                    scope.resolve(key).setValue(this.nodeMaterial.parameters[key].data);
                }
            });

            scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);

            this.ppPorts.forEach((ppPort, pIndex) => {
                if (this.ppTargets[pIndex] && this.ppShaders[pIndex] && this.ppUniformNames[pIndex])
                {
                    scope.resolve(this.ppUniformNames[pIndex]).setValue(null);
                    pc.drawFullscreenQuad(device, this.ppTargets[pIndex], this.vertexBuffer, this.ppShaders[pIndex], rect);
                    scope.resolve(this.ppUniformNames[pIndex]).setValue(this.ppTargets[pIndex].colorBuffer);
                }
            });

            pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
        }
    });

    return {
        GraphEffect: GraphEffect
    };
}());
