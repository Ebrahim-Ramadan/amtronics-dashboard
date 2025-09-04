import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddProjectForm from "./AddProjectForm";
import clientPromise from "@/lib/mongodb";
import {ProjectEditModal} from "./ProjectEditForm";
import dynamicImport from "next/dynamic";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Topleftmenu = dynamicImport(() => import('@/components/top-left-menu'))
interface ProductRef {
  id: string;
  name?: string;
  quantity?: number; // Add quantity field
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
  
  // Force fresh data by adding a timestamp to avoid any potential caching
  const projects = await collection.find({}, { 
    projection: { name: 1, engineers: 1 }
  }).toArray();
  
  return projects.map((p: any) => ({ ...p, _id: p._id.toString() }));
}

export default async function ProjectsPage() {
  const projects = await fetchProjectsFromDB();

  return (
    <div className="min-h-screen w-full  p-2 md:p-6 ">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu/>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Projects Dashboard</h1>
         </div>
        <AddProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="text-center text-gray-500">No projects found.</div>
      ) : (
        projects.map((project) => (
          <Card key={project._id} className="mb-6">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{project.name}</CardTitle>
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
                          <th className="text-left px-3 py-1 border-b border-gray-300">
                            Product Name
                          </th>
                          <th className="text-left px-3 py-1 border-b border-gray-300">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {eng.bundle.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="px-3 py-1">{item.id}</td>
                            <td className="px-3 py-1">{item.name || 'N/A'}</td>
                            <td className="px-3 py-1">{item.quantity ?? 1}</td>
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
