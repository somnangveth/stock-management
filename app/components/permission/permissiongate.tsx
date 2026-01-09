"use client";

import React from 'react';
import { usePermissions } from '@/app/functions/staff/permission/usepermissions';

type PermissionGateProps = {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
  strictMode?: boolean;
}

export function PermissionGate({
  permission,
  requireAll = false,
  fallback = <DefaultFallback/>,
  loadingFallback = <DefaultLoadingFallback/>,
  children,
  strictMode = false

}: PermissionGateProps){
  const {hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, loading} = usePermissions();

  //Show loading State
  if(loading){
    return <>{loadingFallback}</>
  }

  //Admins bypass all checks unless strictMode is enabled
  if(isAdmin && !strictMode){
    return <>{children}</>
  }

  //Normalize permissions to array
  const permissions = Array.isArray(permission) ? permission : [permission];

  //Check permissions
  let hasAccess = false;

  if(permission.length === 0){
    hasAccess = true;
  }else if(permission.length === 1){
    hasAccess = hasPermission(permissions[0]);
  }else if(requireAll){
    hasAccess = hasAllPermissions(permissions);
  }else{
    hasAccess = hasAnyPermission(permissions);
  }


  //Return appropriate content
  if(!hasAccess){
    return <>{fallback}</>
  }

  return <>{children}</>
}


//Default fallback component
function DefaultFallback(){
  return (
   <></>
  )
}
//Default loading fallback component
function DefaultLoadingFallback(){
  return(
    <div className='flex items-center justify-center p-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      <p className='ml-3 text-gray-500'>Checking Permission</p>
    </div>
  );
}


//Utility component for inline permission checks
export function PermissionCheck({
  permission,
  requireAll = false,
  children,
  strictMode = false
}: Omit<PermissionGateProps, 'fallback' | 'loadingFallback'>){
  const {hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, loading} = usePermissions();

  if(loading) return null;
  if(isAdmin && !strictMode) return <>{children}</>

  const permissions = Array.isArray(permission) ? permission : [permission];

  let hasAccess = false;

  if(permissions.length === 1){
    hasAccess = hasPermission(permission[0])
  }else if(requireAll){
    hasAccess = hasAllPermissions(permissions);
  }else{
    hasAccess = hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : null;
}


//Hook for conditional rendering in components
export function usePermissionGate(permission: string | string[], requireAll = false){
  const {hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, loading} = usePermissions();

  if(loading){
    return {canAccess: false, loading: true, isAdmin};
  }

  if(isAdmin){
    return {canAccess: true, loading: false, isAdmin: true};
  }

  const permissions = Array.isArray(permission)? permission : [permission];

  let canAccess = false;

  if(permissions.length === 1){
    canAccess = hasPermission(permissions[0]);
  } else if(requireAll){
    canAccess = hasAllPermissions(permissions);
  }else{
    canAccess = hasAnyPermission(permissions);
  }


  return {canAccess, loading: false, isAdmin: false};
}