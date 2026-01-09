"use client";

import { styledToast } from "@/app/components/toast";
import { fetchPermission, updateAllStaffPermission } from "@/app/functions/admin/permission/permission";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Permission = {
    permission_id: string;
    permission_name: string;
    description: string;
    module: string;
}

export default function PermissionPanel(){
    const [edit, setEdit] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedPermission, setSelectedPermissions] = useState<string[]>([]);

    const router = useRouter();

    //Styling
    const button = "px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50";

    //Fetching permission_table data
    useEffect(() => {
        async function fetchData(){
            try{
                //fetch permission table
                const permissionData = await fetchPermission();

                if(!permissionData){
                    console.error("Failed to fetch permission data");
                    throw new Error("Failed to fetch permissions");
                }

                setPermissions(permissionData);
            }catch(error){
                console.error('Error in fetchData', error);
            }
        }
        fetchData();
    }, []);

    //Update staff Permission
    async function onSubmit(){
        startTransition(async() => {
            try{
                // Pass the selected permission IDs to the backend
                const insertedPermissions = await updateAllStaffPermission(selectedPermission);

                console.log("Inserted permissions: ", insertedPermissions);

                setEdit(false);
                styledToast.success(`Permissions updated successfully! ${selectedPermission.length} permissions assigned to all staff.`);
                
                // Keep selections to show what's currently active
                // setSelectedPermissions([]); // Remove this line to persist selections
            }catch(error){
                console.error("Failed to update permissions: ", error);
                styledToast.error("Failed to update permissions");
            }
        });
    }

    //Handle Cancel
    const onCancel = () => {
        // Optionally reset to previous state here
        setEdit(false);
    }

    //Toggle individual permission
    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
            ? prev.filter(id => id !== permissionId)
            : [...prev, permissionId]
        );
    };

    //Toggle all permission in a module
    const toggleModule = (modulePermIds: string[]) => {
        const allSelected = modulePermIds.every(id =>
            selectedPermission.includes(id)
        );

        if(allSelected){
            setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
        }else{
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePermIds])]);
        }
    };

    //Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.module;
        if(!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    return(
        <div className="p-4 h-calc[100vh-80px]">
            <button
            onClick={() => router.push("/admin/user")}
            className="flex items-center gap-2 mb-5"><ArrowLeft/> Back to main page</button>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Staff Permission Management</h2>
                {!edit ? (
                    <button
                        onClick={() => setEdit(true)}
                        className={button}>
                        Edit Permission
                    </button>
                ):(
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isPending}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isPending}
                            className={button}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                )}
            </div>

            {edit && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Selected permissions will be applied to ALL staff members. 
                        Unchecked permissions will be removed from all staff.
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                        Currently selected: {selectedPermission.length} permission(s)
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden overflow-y-auto">
                {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const modulePermIds = perms.map((p) => p.permission_id);
                    const allSelected = modulePermIds.every((id) => selectedPermission.includes(id));
                    const someSelected = modulePermIds.some((id) => selectedPermission.includes(id));
                    
                    return(
                        <div key={module} className="border rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                <input 
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                        if (input) input.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => toggleModule(modulePermIds)}
                                    disabled={!edit}
                                    className="w-5 h-5" 
                                />
                                <p className="font-bold text-lg">{module}</p>
                            </div>
                            <div className="space-y-3">
                                {perms.map((permission) => (
                                    <div key={permission.permission_id} className="flex items-start gap-2 ml-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermission.includes(permission.permission_id)}
                                            onChange={() => togglePermission(permission.permission_id)}
                                            disabled={!edit}
                                            className="w-4 h-4 mt-1 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{permission.permission_name}</div>
                                            <div className="text-xs text-gray-600">{permission.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}