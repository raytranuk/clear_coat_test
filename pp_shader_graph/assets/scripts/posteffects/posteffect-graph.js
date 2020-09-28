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

        var options = {
            skin: false,
            shaderGraph: nodeMaterial,
            pass: 'PP' // pc.SHADER_FORWARD
        };

        var shaderDefinition = pc.programlib.node.createShaderDefinition(graphicsDevice, options);

        /*var psCode = "precision " + graphicsDevice.precision + " float;\n" +
                pc.shaderChunks.screenDepthPS +
                "\nvarying vec2 vUv0;\n"+
                "void main() {\n"+
                "    float depth = getLinearScreenDepth(vUv0);\n"+
                "    gl_FragColor = vec4(vec3(depth * 0.03125), 1.0);\n"+
//                "    vec3 depthCol = texture2D(depthMap,vUv0).rgb;\n"+
//                "    gl_FragColor = vec4(vec3(depth * 0.01), 1.0);\n"+
                "}";

        var defs = "#version 300 es\n\n#define varying in\nout highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define texture2D texture\n#define textureCube texture\n#define texture2DProj textureProj\n#define texture2DLodEXT textureLod\n#define texture2DProjLodEXT textureProjLod\n#define textureCubeLodEXT textureLod\n#define texture2DGradEXT textureGrad\n#define texture2DProjGradEXT textureProjGrad\n#define textureCubeGradEXT textureGrad\n#define GL2\n";

        shaderDefinition.fshader = defs + psCode;*/

        // vec4 fogtest(in vec4 A, in vec4 B, in float depth){return vec4(mix((B.rgb*B.a),(A.rgb*A.a),depth),1);}

        this.shader = new pc.Shader(graphicsDevice, shaderDefinition);

        nodeMaterial.updateUniforms();

        // Shader author: Mr. Drag N. Drop
/*        this.shader = new pc.Shader(graphicsDevice, {
            attributes: {
                aPosition: pc.SEMANTIC_POSITION
            },
            vshader: [
                "attribute vec2 aPosition;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = vec4(aPosition, 0.0, 1.0);",
                "    vUv0 = (aPosition.xy + 1.0) * 0.5;",
                "}"
            ].join("\n"),
            fshader: [
                "precision " + graphicsDevice.precision + " float;",
                "",
                "varying vec2 vUv0;",
                "",
                "uniform sampler2D uColorBuffer;",
                "uniform sampler2D uDepthMap;",
                "",
                "void main()",
                "{",
                "    vec4 col;",
                "",
                "    gl_FragColor.rgb = vec3(dot(col,vec3(0.5,0.7,0.2)));",
                "    gl_FragColor.a = 1.0;",
                "}"
            ].join("\n")
        });*/

        // Uniforms
        //this.maxBlur = 1;
        //this.aperture = 0.025;
        //this.focus = 1;
        //this.aspect = 1;
        this.nodeMaterial = nodeMaterial;
    };

    GraphEffect.prototype = Object.create(pc.PostEffect.prototype);
    GraphEffect.prototype.constructor = GraphEffect;

    Object.assign(GraphEffect.prototype, {
        render: function (inputTarget, outputTarget, rect) {
            var device = this.device;
            var scope = device.scope;

            Object.keys(this.nodeMaterial.parameters).forEach((key) => {
                scope.resolve(key).setValue(this.nodeMaterial.parameters[key].data);
            });

            scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
            // scope.resolve("uDepthMap").setValue(this.depthMap);

            pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
        }
    });

    return {
        GraphEffect: GraphEffect
    };
}());

// ----------------- SCRIPT DEFINITION ------------------ //
var Graph = pc.createScript('graph');

Graph.attributes.add('maxBlur', {
    type: 'number',
    default: 1,
    min: 0,
    max: 1,
    precision: 5,
    title: 'Max Blur'
});

Graph.attributes.add('aperture', {
    type: 'number',
    default: 0.025,
    min: 0,
    max: 1,
    precision: 5,
    title: 'Aperture'
});

Graph.attributes.add('focus', {
    type: 'number',
    default: 1,
    title: 'Focus'
});

Graph.attributes.add('aspect', {
    type: 'number',
    default: 1,
    title: 'Aspect'
});

Graph.prototype.initialize = function () {
    this.effect = new pc.GraphEffect(this.app.graphicsDevice);
    this.effect.maxBlur = this.maxBlur;
    this.effect.aperture = this.aperture;
    this.effect.focus = this.focus;
    this.effect.aspect = this.aspect;

    this.on('attr', function (name, value) {
        this.effect[name] = value;
    }, this);

    var queue = this.entity.camera.postEffects;

    queue.addEffect(this.effect);

    this.on('state', function (enabled) {
        if (enabled) {
            queue.addEffect(this.effect);
        } else {
            queue.removeEffect(this.effect);
        }
    });

    this.on('destroy', function () {
        queue.removeEffect(this.effect);
    });
};
