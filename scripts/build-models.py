"""Rebuild the two Acadie GLBs with blender -b -P scripts/build-models.py."""
import math
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / "public" / "models"
TAU = math.tau


class Mesh:
    """Batch low-poly parts using a single vertex-colour material per mesh."""
    def __init__(self):
        self.vertices = []
        self.faces = []
        self.colors = []

    def face(self, points, hex_color):
        first = len(self.vertices)
        self.vertices.extend(points)
        self.faces.append(tuple(range(first, first + len(points))))
        self.colors.extend([hex_color] * len(points))

    def bridge(self, a, b, color):
        for i in range(len(a)):
            j = (i + 1) % len(a)
            self.face([a[i], a[j], b[j], b[i]], color)

    def beam(self, start, end, radius, color, tip=None, sides=8):
        start, end = Vector(start), Vector(end)
        axis = (end - start).normalized()
        u = axis.cross(Vector((0, 0, 1)) if abs(axis.z) < .9 else Vector((0, 1, 0))).normalized()
        v = axis.cross(u)
        offsets = [u * math.cos(i * TAU / sides) + v * math.sin(i * TAU / sides) for i in range(sides)]
        a = [start + radius * q for q in offsets]
        b = [end + (tip if tip is not None else radius) * q for q in offsets]
        self.bridge(a, b, color)
        self.face(a[::-1], color)
        self.face(b, color)

    def finish(self, name):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        colors = mesh.color_attributes.new(name="Pigment", type="BYTE_COLOR", domain="POINT")
        for attr, value in zip(colors.data, self.colors):
            attr.color_srgb = tuple(int(value[i:i+2], 16) / 255 for i in (0, 2, 4)) + (1,)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        mat = bpy.data.materials.new(name + " finish")
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Roughness"].default_value = .9
        pigment = mat.node_tree.nodes.new("ShaderNodeVertexColor")
        pigment.layer_name = "Pigment"
        mat.node_tree.links.new(pigment.outputs["Color"], shader.inputs["Base Color"])
        mesh.materials.append(mat)
        return obj


def vessel():
    m = Mesh()
    # Cross sections from stem to transom (x, half-beam, gunwale, keel).
    stations = [(-12,.09,2.85,.6),(-10.7,1.45,2.25,-1),(-8.5,2.65,1.85,-2),
                (-5,3.35,1.65,-2.35),(0,3.5,1.65,-2.4),(4,3.45,1.75,-2.3),
                (6,3.32,3.45,-2.1),(8.8,3.05,4.15,-1.8),(12,2.48,4.42,-1.45)]
    boards = ["35302a","45382d","56402e","695039","7b593b","876344",
              "70543d","aa8754","773f30","925240","c09c63"]

    def point(s, t, side):
        x, width, top, keel = s
        breadth = (.05 + .95 * math.sin(t * math.pi * .59)**.68)
        return (x, side * width * breadth, keel + (top-keel)*t)

    for side in (-1, 1):
        for a,b in zip(stations, stations[1:]):
            for i,color in enumerate(boards):
                lo,hi = i/len(boards),(i+1)/len(boards)
                quad = [point(a,lo,side),point(a,hi,side),point(b,hi,side),point(b,lo,side)]
                m.face(quad if side == 1 else quad[::-1], color)
            for t,r,c in [(.70,.075,"463828"),(.91,.065,"49382d"),(1,.085,"c6a575")]:
                m.beam(point(a,t,side),point(b,t,side),r,c,sides=6)
    for s in (stations[0], stations[-1]):
        for i,c in enumerate(boards):
            lo,hi=i/len(boards),(i+1)/len(boards)
            q=[point(s,lo,-1),point(s,lo,1),point(s,hi,1),point(s,hi,-1)]
            m.face(q if s[0]>0 else q[::-1],c)
    # Deck planks follow the hull width and leave a raised afterdeck.
    for a,b in zip(stations, stations[1:]):
        za,zb = (a[2]-.32,b[2]-.32) if a[0]>=6 or b[0]<=-8.5 else (1.2,1.2)
        for j in range(20):
            left,right = -1+j*.1,-1+(j+1)*.1
            m.face([(a[0],a[1]*.955*left,za),(b[0],b[1]*.955*left,zb),
                    (b[0],b[1]*.955*right,zb),(a[0],a[1]*.955*right,za)],
                   ["ab8a61","b59971","ac906c","bca17b"][j%4])
    for x,w,h in [(6,3.15,3.13),(-8.5,2.5,1.53)]:
        m.face([(x,-w,1.2),(x,-w,h),(x,w,h),(x,w,1.2)],"75573c")
    # Tapered spars, shrouds and tied canvas. Keep the waist clear for the trade scene.
    rope="514435"
    for x,h,width in [(-6,15,9),(0,19,11),(7.2,11,0)]:
        base=1.2
        m.beam((x,0,base),(x,0,base+h),.23,"715337",.095)
        for side in (-1,1):
            for j in range(4):
                m.beam((x+(j-1.5)*.55,side*(3 if x<6 else 2.7),1.65 if x<6 else 3.8),
                       (x,side*.13,base+h*.75),.035,rope,sides=4)
        if width:
            m.beam((x,0,base+h*.73),(x,0,base+h*.73+.42),.36,"705138",.56)
        yards = [(.62,width),(.94,width*.68)] if width else [(.65,8)]
        for fraction,span in yards:
            def yard(t):
                return Vector((x,span*t,base+h*fraction)) if width else Vector((x+span*t,0,base+h*fraction+span*t*.52))
            m.beam(yard(-.52),yard(.52),.09,"71543a")
            for j in range(8):
                p,q=yard(-.46+j*.115),yard(-.46+(j+1)*.115)
                p.z-=.14
                q.z-=.14
                middle=(p+q)/2
                middle.z-=.09
                m.beam(p,middle,.14,"d6c5a7",.25)
                m.beam(middle,q,.25,"e1d2b6",.14)
        m.face([(x,0,base+h),(x,0,base+h+.35),(x+2.4,.22,base+h+.17)],"e4dac5")
    m.beam((-10,0,2.1),(-18.4,0,4.95),.18,"76583d",.075)
    for a,b in [((-18.4,0,4.95),(-6,0,16.2)),((-6,0,16.2),(0,0,20.2)),((0,0,20.2),(7.2,0,12.2))]:
        m.beam(a,b,.045,rope,sides=5)
    m.beam((11.6,0,4),(11.6,0,7.7),.065,"6c5036")
    m.finish("ship_hull")
    flag=Mesh()
    for i in range(6):
        for j in range(5):
            def cloth(k,l):
                return (k*.37, .15*math.sin(k*1.1),l*.25-.055*k)
            flag.face([cloth(i,j),cloth(i+1,j),cloth(i+1,j+1),cloth(i,j+1)],
                      "454954" if i==2 or j==2 else "e9dfca")
    flag.finish("stern_flag").location=(11.6,0,6.35)


def well():
    m=Mesh()
    colors=["92897a","aa9f8c","807b71","a29784","968f80"]
    for row in range(4):
        for i in range(14):
            angle=(i+row*.5)*TAU/14
            end=angle+TAU/14-.016
            radius=.90-.016*row+.018*math.sin(i*13+row)
            def course(z, inset):
                return [(r*math.cos(a),r*math.sin(a),z)
                        for r,a in [(radius-inset,angle),(radius-inset,end),(.61+inset,end),(.61+inset,angle)]]
            base=course(row*.225, .015)
            shoulder=course(row*.225+.035,0)
            lip=course(row*.225+.205,0)
            cap=course(row*.225+.223,.018)
            color=colors[(i*3+row)%5]
            for a,b in [(base,shoulder),(shoulder,lip),(lip,cap)]:
                m.bridge(a,b,color)
            m.face(cap,color)
    m.beam((0,0,.08),(0,0,.10),.64,"293635",sides=24)
    for x in (-.77,.77):
        m.beam((x,0,.4),(x,0,2.24),.124,"785a40",sides=4)
    m.beam((-1,0,1.97),(1.03,0,1.97),.115,"936e48")
    m.beam((1,0,1.97),(1,.09,1.65),.046,"634f3c")
    m.beam((1,.09,1.65),(1.26,.09,1.65),.05,"987750")
    for i in range(10):
        x=-.18+i*.037
        m.beam((x,0,1.97),(x+.032,0,1.97),.138,"b09a70",sides=12)
    m.beam((.15,.126,1.97),(.15,.126,1.28),.02,"aa9066")
    for dx in (-.15,.15):
        m.beam((.15+dx,.126,1.13),(.15,.126,1.28),.015,"575449")
    m.beam((.15,.126,.88),(.15,.126,1.13),.13,"886746",.16)
    m.beam((.15,.126,1.131),(.15,.126,1.136),.14,"493c30")
    for z,r in [(.92,.14),(1.09,.16)]:
        m.beam((.15,.126,z),(.15,.126,z+.024),r,"56544b")
    m.finish("well_masonry_and_windlass")


for name,build in [("ship",vessel),("well",well)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    bpy.ops.export_scene.gltf(filepath=str(OUT / (name+".glb")),export_format="GLB")
