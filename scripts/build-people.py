"""Build the joint-local meshes used by the Acadie crowd. Run with blender -b -P."""
import math
from pathlib import Path

import bpy
from mathutils.bvhtree import BVHTree

bpy.ops.wm.read_factory_settings(use_empty=True)
OUT = Path(__file__).resolve().parents[1] / "public/models/people.glb"
material = bpy.data.materials.new("Cloth, hair and skin tints")
material.use_nodes = True
color_node = material.node_tree.nodes.new("ShaderNodeVertexColor")
color_node.layer_name = "Pigment"
material.node_tree.links.new(color_node.outputs["Color"], material.node_tree.nodes["Principled BSDF"].inputs["Base Color"])


class Part:
    """Loft measured cross sections in figure coordinates (right, up, forward)."""
    def __init__(self):
        self.vertices, self.faces, self.colors = [], [], []

    def loft(self, rows, pigment="ffffff", fixed=False, x=0, sides=12, folds=0):
        first = len(self.vertices)
        for h, width, depth, front in rows:
            for i in range(sides):
                a = i * math.tau / sides
                ripple = 1 + folds * math.cos(6*a + h*4)
                self.vertices.append((x + width*math.cos(a)*ripple, -(front + depth*math.sin(a)*ripple), h))
                self.colors.append(tuple(int(pigment[k:k+2],16)/255 for k in (0,2,4)) + (float(fixed),))
        for j in range(len(rows)-1):
            for i in range(sides):
                a = first + j*sides+i
                b = first + j*sides+(i+1)%sides
                self.faces.append((a,a+sides,b+sides,b))
        self.faces.append(tuple(first+i for i in range(sides)))
        last = len(self.vertices)-1
        self.faces.append(tuple(last-i for i in range(sides)))

    def oval(self,x,h,front,rx,rh,rd,pigment="ffffff",fixed=False):
        rows = []
        for i in range(7):
            a = math.pi*(i+.015)/6.03
            rows.append((h-rh*math.cos(a),rx*math.sin(a),rd*math.sin(a),front))
        self.loft(rows,pigment,fixed,x,sides=10)

    def patch(self,points,pigment,fixed=False):
        # Orient outward on the front of the figure.
        area=sum(x*points[(i+1)%len(points)][1]-h*points[(i+1)%len(points)][0]
                 for i,(x,h,_) in enumerate(points))
        if area<0:
            points=points[::-1]
        first=len(self.vertices)
        for x,h,z in points:
            self.vertices.append((x,-z,h))
            self.colors.append(tuple(int(pigment[k:k+2],16)/255 for k in (0,2,4))+(float(fixed),))
        self.faces.append(tuple(first+i for i in range(len(points))))

    def save(self,name):
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices,[],self.faces)
        mesh.update()
        colors=mesh.color_attributes.new(name="Pigment",type="BYTE_COLOR",domain="POINT")
        for slot,value in zip(colors.data,self.colors):
            slot.color_srgb=value
        for face in mesh.polygons:
            face.use_smooth=True
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        mesh.materials.append(material)


def torso(wrap, winter=False):
    p=Part()
    p.loft([(-.126,.215,.14,0),(-.111,.222,.145,0),(.02,.204,.139,0),
            (.119,.172,.122,.004),(.22,.178,.132,.003),(.35,.203,.148,.004),
            (.455,.211,.144,0),(.50,.206,.119,-.007),(.53,.173,.094,-.008),
            (.566,.088,.072,0)],folds=.024,sides=24)
    surface=BVHTree.FromPolygons(p.vertices,p.faces)
    def ribbon(start,end,width,pigment,fixed=False):
        previous=None
        for i in range(13):
            t=i/12
            x=start[0]*(1-t)+end[0]*t
            h=start[1]*(1-t)+end[1]*t
            row=[]
            for u in (-1,0,1):
                xx=x+u*width(t)
                hit=surface.ray_cast((xx,-1,h),(0,1,0))[0]
                row.append((xx,h,-hit.y+.0035 if hit else .085))
            if previous:
                for j in range(2):
                    p.patch([previous[j],previous[j+1],row[j+1],row[j]],pigment,fixed)
            previous=row
    p.loft([(.089,.188,.138,.003),(.098,.19,.140,.003),(.14,.186,.139,.003)],"634b39",True,sides=24)
    p.oval(.052,.115,.143,.020,.014,.005,"958266",True)
    if wrap:
        ribbon((-.097,.53),(.115,.145),lambda t:.016+.016*(1-t),"ddcdb8")
        if winter:
            # An overlapping outer layer, cut high at one side to clear the working arm.
            mantle_start=len(p.vertices)
            p.loft([(.27,.216,.163,0),(.29,.217,.163,0),(.46,.216,.151,0),
                    (.515,.188,.119,-.006),(.55,.135,.093,-.006),(.565,.088,.075,0)],
                   "e6dccd",sides=24,folds=.032)
            for i in range(48):
                x,y,h=p.vertices[mantle_start+i]
                p.vertices[mantle_start+i]=(x,y,h+.32*x)
    else:
        ribbon((.004,.487),(.004,.146),lambda t:.012,"e1dace")
        for side in (-1,1):
            ribbon((side*.045,.548),(side*.060,.469),lambda t:.001+.045*(1-t),"dbcfb7",True)
        for h,front in [(.20,.137),(.28,.147),(.36,.157),(.432,.151)]:
            p.oval(.012,h,front,.009,.009,.005,"806c51",True)
    p.save("winterWrap" if winter else "wrap" if wrap else "torso")


def face():
    p=Part()
    p.loft([(-.127,.063,.063,-.009),(-.051,.058,.062,-.008),(.042,.063,.067,-.008)])
    p.loft([(-.008,.043,.049,.026),(.011,.069,.077,.02),(.042,.090,.091,.009),
            (.082,.103,.100,.004),(.129,.110,.106,0),(.173,.111,.11,-.005),
            (.207,.104,.102,-.01),(.234,.078,.080,-.014),(.248,.032,.042,-.016)],sides=20)
    for side in (-1,1):
        p.oval(side*.106,.105,-.005,.021,.031,.015,"f1ded0")
        p.oval(side*.044,.126,.095,.022,.0065,.005,"b4a599",True)
        p.oval(side*.043,.126,.100,.008,.006,.004,"463c33",True)
        p.patch([(side*.02,.143,.107),(side*.047,.151,.101),(side*.069,.145,.084),
                 (side*.047,.145,.102),(side*.021,.138,.107)][::side],"614c3e",True)
    p.loft([(.075,.012,.009,.099),(.087,.021,.015,.111),(.096,.014,.018,.113),
            (.127,.010,.009,.101),(.144,.009,.006,.101)],"f7eadf")
    p.oval(0,.056,.100,.028,.0038,.0035,"916855",True)
    p.save("head")


def hair():
    p=Part()
    # Vary the lowest ring around the skull to expose the forehead and cover the nape.
    p.loft([(.16,.109,.111,-.009),(.19,.114,.116,-.009),(.223,.105,.10,-.012),
            (.246,.073,.076,-.015),(.26,.032,.031,-.018)],sides=20)
    for i in range(20):
        a=i*math.tau/20
        x,y,h=p.vertices[i]
        p.vertices[i]=(x,y,h-.105*(1-math.sin(a))*.5)
    p.save("hair")
    p=Part()
    for side in (-1,1):
        p.loft([(-.17,.018,.02,-.056),(-.143,.041,.038,-.06),(-.04,.052,.051,-.064),
                (.07,.05,.064,-.054),(.164,.039,.054,-.047)],x=side*.07)
    p.oval(0,.011,-.079,.086,.147,.039)
    p.save("hairLong")
    p=Part()
    p.loft([(-.017,.042,.051,.029),(-.005,.065,.081,.026),(.017,.083,.091,.019),
            (.041,.096,.099,.012),(.054,.097,.102,.008)],"f6f2eb",sides=20)
    for side in (-1,1):
        p.oval(side*.016,.069,.101,.017,.005,.005)
    p.save("beard")


def limbs():
    p=Part()
    p.loft([(-.46,.066,.077,.008),(-.407,.076,.083,.005),(-.33,.095,.099,0),
            (-.15,.101,.112,-.007),(.001,.095,.101,-.013),(.032,.065,.077,-.011)],folds=.027)
    p.save("thigh")
    p=Part()
    p.loft([(-.39,.043,.053,-.005),(-.28,.049,.061,-.008),(-.16,.068,.081,-.013),
            (-.079,.071,.080,0),(.012,.065,.072,.007),(.039,.042,.053,.008)])
    p.loft([(-.456,.068,.130,.052),(-.43,.071,.139,.055),(-.402,.067,.125,.049),
            (-.37,.059,.089,.019),(-.31,.055,.066,-.004),(-.255,.06,.071,-.008)],"62503e",True)
    p.loft([(-.48,.065,.136,.055),(-.46,.073,.143,.056),(-.449,.072,.14,.055)],"423932",True)
    p.save("shin")
    p=Part()
    p.loft([(-.303,.052,.055,.006),(-.258,.063,.063,-.003),(-.153,.070,.079,-.006),
            (-.048,.077,.084,-.005),(.011,.070,.073,0),(.044,.044,.056,0),(.053,.02,.025,0)],folds=.02)
    p.save("arm")
    p=Part()
    p.loft([(-.233,.042,.048,.012),(-.208,.048,.053,.012),(-.135,.060,.069,.007),
            (-.048,.060,.066,0),(.018,.051,.057,0),(.038,.033,.039,0)])
    p.loft([(-.247,.043,.048,.013),(-.236,.046,.05,.013),(-.210,.049,.053,.012)],"d4c7b4")
    p.save("forearm")
    for side,name in [(1,"handL"),(-1,"handR")]:
        p=Part()
        p.loft([(-.092,.019,.032,.02),(-.074,.033,.044,.018),(-.041,.035,.045,.018),
                (.008,.031,.036,.016),(.035,.031,.034,.014)])
        p.oval(-side*.027,-.026,.046,.016,.034,.019,"f5eae0")
        p.save(name)


def wardrobe():
    p=Part()
    p.loft([(-.86,.245,.189,.006),(-.846,.253,.191,.006),(-.51,.235,.163,-.009),
            (-.18,.203,.146,0),(.04,.17,.125,0)],folds=.055,sides=24)
    p.save("skirt")
    p=Part()
    p.loft([(.17,.189,.177,-.01),(.184,.204,.19,-.012),(.195,.145,.143,-.009),
            (.202,.112,.119,-.008),(.273,.095,.101,-.012),(.288,.073,.084,-.012)],sides=24)
    for i in range(48):
        x,y,h=p.vertices[i]
        p.vertices[i]=(x,y,h+.016*(abs(x)/.204)**2-.009*math.sin(i%24*math.tau/24))
    p.loft([(.201,.118,.125,-.008),(.224,.113,.120,-.009)],"564637",True,sides=24)
    p.save("felt")
    p=Part()
    p.loft([(.167,.107,.113,-.009),(.18,.117,.121,-.009),(.219,.117,.119,-.012),
            (.25,.102,.106,-.021),(.274,.078,.081,-.036),(.285,.038,.043,-.049)],sides=18)
    p.loft([(.167,.111,.116,-.009),(.18,.121,.124,-.009),(.197,.12,.123,-.01)],"dad3c7")
    p.save("monmouth")


torso(False)
torso(True)
torso(True,winter=True)
face()
hair()
limbs()
wardrobe()
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format="GLB",export_vertex_color="ACTIVE")
