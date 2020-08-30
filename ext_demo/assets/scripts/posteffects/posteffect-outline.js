// --------------- POST EFFECT DEFINITION --------------- //
Object.assign(pc, function () {

    /**
     * @class
     * @name pc.OutlineEffect
     * @classdesc Applies an outline effect on input render target
     * @description Creates new instance of the post effect.
     * @augments pc.PostEffect
     * @param {pc.GraphicsDevice} graphicsDevice - The graphics device of the application.
     * @property {pc.Texture} texture The outline texture to use.
     * @property {pc.Color} color The outline color.
     */
    var OutlineEffect = function (graphicsDevice) {
        pc.PostEffect.call(this, graphicsDevice);

        this.shader = new pc.Shader(graphicsDevice, {
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
                "uniform float uWidth;",
                "uniform float uHeight;",
                "uniform vec4 uOutlineCol;",
                "uniform sampler2D uColorBuffer;",
                "uniform sampler2D uOutlineTex;",
                "",
                "varying vec2 vUv0;",
                "",
                "void main(void)",
                "{",
                "    vec4 texel1 = texture2D(uColorBuffer, vUv0);",
                "    float sample0 = texture2D(uOutlineTex, vUv0).a;",
                "    float outline = (sample0>0.0)? 1.0 : 0.0;",
                "    float lum = dot(texel1.rgb, vec3(0.2125, 0.7154, 0.0721));",
                "    gl_FragColor = mix(texel1, mix(vec4(vec3(lum),texel1.a), vec4(uOutlineCol.rgb,1), outline), uOutlineCol.a);",
                "}"
            ].join("\n")
        });

        // Uniforms
        this.color = new pc.Color(1, 1, 1, 1);
        this.texture = new pc.Texture(graphicsDevice);
        this.texture.name = 'pe-outline';
    };

    OutlineEffect.prototype = Object.create(pc.PostEffect.prototype);
    OutlineEffect.prototype.constructor = OutlineEffect;

    Object.assign(OutlineEffect.prototype, {
        render: function (inputTarget, outputTarget, rect) {
            var device = this.device;
            var scope = device.scope;

            scope.resolve("uWidth").setValue(inputTarget.width);
            scope.resolve("uHeight").setValue(inputTarget.height);
            scope.resolve("uOutlineCol").setValue(this.color.data);
            scope.resolve("uColorBuffer").setValue(inputTarget.colorBuffer);
            scope.resolve("uOutlineTex").setValue(this.texture);
            pc.drawFullscreenQuad(device, outputTarget, this.vertexBuffer, this.shader, rect);
        }
    });

    return {
        OutlineEffect: OutlineEffect
    };
}());

// ----------------- SCRIPT DEFINITION ------------------ //
var Outline = pc.createScript('outline');

Outline.attributes.add('color', {
    type: 'rgb',
    default: [0.5, 0.5, 0.5, 1],
    title: 'Color'
});

Outline.attributes.add('texture', {
    type: 'asset',
    assetType: 'texture',
    title: 'Texture'
});

Outline.prototype.initialize = function () {
    this.effect = new pc.OutlineEffect(this.app.graphicsDevice);
    this.effect.color = this.color;
    this.effect.texture = this.texture.resource;

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

    this.on('attr:color', function (value) {
        this.effect.color = value;
    }, this);

    this.on('attr:texture', function (value) {
        this.effect.texture = value ? value.resource : null;
    }, this);
};
