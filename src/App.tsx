import React from 'react';
import './App.css';
import {Image, Layer, Line, Stage} from 'react-konva';
import useImage from 'use-image';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import Konva from "konva";
import Modal from 'react-modal';
import KonvaEventObject = Konva.KonvaEventObject;

Modal.setAppElement('#root');

interface Stroke {
    tool: string;
    penColor: string;
    thickness: number;
    points: Array<number>
}

type Strokes = Array<Stroke>;

const colors: { [key: string]: string } = {
    "red": "#ff0100",
    "blue": "#0625f2",
    "yellow": "#ffea00",
    "green": "#13ff00",
    "black": "#0e0e0e",
    "brown": "#a9422d",
}

// function from https://stackoverflow.com/a/15832662/512042
function downloadURI(uri: string, name: string) {
    var link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const Canvas = () => {
    const [image] = useImage('eye.png');
    const [tool, setTool] = React.useState<string>('pen');
    const [version, setVersion] = React.useState<number>(1);
    const [versions, setVersions] = React.useState<Array<Strokes>>([]);
    const [viewAllVersions, setViewAllVersions] = React.useState<boolean>(false);
    const [strokes, setStrokes] = React.useState<Strokes>([]);
    const [penColor, setPenColor] = React.useState<string>("red");
    const [thickness, setThickness] = React.useState<number>(1);
    const [scale, setScale] = React.useState<number>(1);
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const isDrawing = React.useRef(false);
    const stageRef = React.useRef(null);

    const handleExport = () => {
        if (stageRef != null && stageRef.current != null) {
            // @ts-ignore
            const uri = stageRef.current.toDataURL();
            downloadURI(uri, 'stage.png');
        }
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
        isDrawing.current = true;
        let stage = e.target.getStage();
        if (stage != null) {
            const pos = stage.getPointerPosition();
            if (pos != null) {
                setStrokes([...strokes, {tool, thickness, penColor: colors[penColor], points: [pos.x, pos.y]}]);
            }
        }
    };

    const handlerSlider = (newValue: number) => {
        if (newValue === version) return;
        setVersion(newValue);
        setStrokes(versions[newValue - 1]);
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }

        const stage = e.target.getStage();
        if (stage != null) {
            const point = stage.getPointerPosition();
            let lastStroke = strokes[strokes.length - 1];

            if (point != null) {
                // add point
                lastStroke.points = lastStroke.points.concat([point.x, point.y]);

                // replace last
                strokes.splice(strokes.length - 1, 1, lastStroke);
                setStrokes(strokes.concat());
            }
        }
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const addNewVersion = () => {
        let newVersions = [...versions, strokes];
        setVersions(newVersions);
        setStrokes([]);
        setVersion(version + 1);
    };

    const oldLayers = viewAllVersions &&
        versions.map((imageVersion, i: number) => (
            <Layer key={i} opacity={(i / versions.length) + 0.3}>
                {
                    imageVersion.map((stroke, j: number) => (
                        <Line
                            key={j}
                            points={stroke.points}
                            stroke={stroke.penColor}
                            strokeWidth={stroke.thickness}
                            tension={1}
                            lineCap="round"
                            globalCompositeOperation={
                                stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                        />
                    ))}
            </Layer>
        ));

    const currentLayer = <Layer>
        {strokes.map((stroke, i) => (
            <Line
                key={i}
                points={stroke.points}
                stroke={stroke.penColor}
                strokeWidth={stroke.thickness}
                tension={1}
                lineCap="round"
                globalCompositeOperation={
                    stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
            />
        ))}
    </Layer>;

    const imageLayer = <Layer>
        <Image image={image}/>
    </Layer>;

    return (
        <div>
            <div>
                <form>
                    <label htmlFor="fname">First name:</label><br/>
                    <input type="text" id="fname" name="fname" defaultValue="John"/><br/>
                    <label htmlFor="lname">Last name:</label><br/>
                    <input type="text" id="lname" name="lname" defaultValue="Doe"/><br/><br/><br/>
                </form>

                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight / 2}
                    onDblClick={() => setModalOpen(true)}
                    onDblTap={() => setModalOpen(true)}
                    ref={stageRef}
                >
                    {imageLayer}
                    {currentLayer}
                </Stage>
                <input type="button" onClick={handleExport} value="Download"/>

                <Modal
                    isOpen={modalOpen}
                    onRequestClose={() => setModalOpen(false)}
                    contentLabel="Example Modal"
                >
                    <select
                        value={tool}
                        onChange={(e) => {
                            setTool(e.target.value);
                        }}
                    >
                        <option value="pen">Pen</option>
                        <option value="eraser">Eraser</option>
                    </select>

                    <select
                        value={penColor}
                        onChange={(e) => {
                            setPenColor(e.target.value);
                        }}
                    >
                        {Object.keys(colors).map(color => <option key={color} value={color}>{color.toUpperCase()}</option>)}
                    </select>

                    <Slider
                        value={thickness}
                        min={0}
                        max={5}
                        step={1}
                        onChange={setThickness}
                    />

                    <Stage
                        scaleX={scale}
                        scaleY={scale}
                        width={window.innerWidth}
                        height={window.innerHeight / 2}
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}

                        onTouchMove={handleMouseMove}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
                    >
                        {imageLayer}
                        {currentLayer}
                        {oldLayers}
                    </Stage>

                    <input type="button" onClick={addNewVersion} value="New version"/>
                    <input type="button" onClick={() => setViewAllVersions(!viewAllVersions)}
                           value="Toggle all versions"/>

                    <br/>

                    <input type="button" onClick={() => setScale(2)} value="Zoom in"/>
                    <input type="button" onClick={() => setScale(1)} value="Zoom out"/>

                    <Slider
                        value={version}
                        min={1}
                        max={versions.length}
                        step={1}
                        onChange={handlerSlider}
                    />
                </Modal>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <div>
            <Canvas/>
        </div>
    );
};

export default App;
