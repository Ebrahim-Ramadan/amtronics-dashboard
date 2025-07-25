import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddProjectForm from "./AddProjectForm";
import clientPromise from "@/lib/mongodb";
import {ProjectEditModal} from "./ProjectEditForm";

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
  return projects.map((p: any) => ({ ...p, _id: p._id.toString() }));
}

export default async function ProjectsPage() {
  const projects = await fetchProjectsFromDB();

  return (
    <div className="min-h-screen w-full  p-2 md:p-6 ">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <AddProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-gray-500">No projects found.</div>
      ) : (
        projects.map((project) => (
          <Card key={project._id} className="mb-6">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{project.name}</CardTitle>
              {/* Pass project to client component for editing */}
              <ProjectEditModal project={project} />

            </CardHeader>

            <CardContent>
              {project.engineers.map((eng, idx) => (
                <div key={idx} className="mb-4">
                  <div className="font-semibold text-blue-700 mb-2">
                    Engineer: {eng.name}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-1 border-b border-gray-300">
                            Product ID
                          </th>
                         
                        </tr>
                      </thead>
                      <tbody>
                        {eng.bundle.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="px-3 py-1">{item.id}</td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
