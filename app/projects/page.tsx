import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddProjectForm from "./AddProjectForm";
import clientPromise from "@/lib/mongodb";

interface ProductRef {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface Engineer {
  name: string;
  bundle: ProductRef[];
}

interface Project {
  _id: string;
  name: string;
  engineers: Engineer[];
}

async function fetchProjectsFromDB(): Promise<Project[]> {
  const client = await clientPromise;
  const db = client.db("amtronics");
  const collection = db.collection("projects");
  const projects = await collection.find({}, { projection: { name: 1, engineers: 1 } }).toArray();
  // Convert _id to string for React keys
  return projects.map((p: any) => ({ ...p, _id: p._id.toString() }));
}

export default async function ProjectsPage() {
  const projects = await fetchProjectsFromDB();

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Projects</h1>
          <AddProjectForm />
        </div>
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">No projects found.</div>
        ) : (
          projects.map((project) => (
            <Card key={project._id} className="mb-6">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {project.engineers.map((eng, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="font-semibold text-blue-700 mb-2">Engineer: {eng.name}</div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product ID</TableHead>
                            {/* <TableHead>Name</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Price</TableHead> */}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eng.bundle.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.id}</TableCell>
                              {/* <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                              </TableCell>
                              <TableCell>${item.price}</TableCell> */}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
 