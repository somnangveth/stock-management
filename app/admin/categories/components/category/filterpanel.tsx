"use client";

import { Categories } from "@/type/producttype";
import { useState, useMemo } from "react";

interface FilterPanelProps {
  categories: Categories[];
  onApplyFilter: (selectedIds: string[]) => void;
  onClose: () => void;
}

export function FilterPanel({ categories, onApplyFilter, onClose }: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Group categories by top-level parent
  const groupedCategories = useMemo(() => {
    const groups: { [key: string]: { parent: Categories; children: Categories[] } } = {};

    categories.forEach((cat) => {
      // Find the root parent
      let rootParent = cat;
      let current = cat;
      
      while (current.parent_id !== null) {
        const parent = categories.find((c) => String(c.category_id) === current.parent_id);
        if (parent) {
          rootParent = parent;
          current = parent;
        } else {
          break;
        }
      }

      // Initialize group if it doesn't exist
      if (!groups[rootParent.category_id]) {
        groups[rootParent.category_id] = {
          parent: rootParent,
          children: [],
        };
      }

      // Add to children if not the root itself
      if (cat.category_id !== rootParent.category_id) {
        groups[rootParent.category_id].children.push(cat);
      }
    });

    return Object.values(groups);
  }, [categories]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const toggleGroup = (groupId: string, childrenIds: string[]) => {
    const newSelected = new Set(selectedCategories);
    const allSelected = [groupId, ...childrenIds].every((id) => newSelected.has(id));

    if (allSelected) {
      // Unselect all
      newSelected.delete(groupId);
      childrenIds.forEach((id) => newSelected.delete(id));
    } else {
      // Select all
      newSelected.add(groupId);
      childrenIds.forEach((id) => newSelected.add(id));
    }
    setSelectedCategories(newSelected);
  };

  const handleApply = () => {
    onApplyFilter(Array.from(selectedCategories));
  };

  const handleClear = () => {
    setSelectedCategories(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Filter by Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {groupedCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No categories available</div>
          ) : (
            <div className="space-y-4">
              {groupedCategories.map((group) => {
                const childrenIds = group.children.map((c) => String(c.category_id));
                const allChildrenSelected = childrenIds.every((id) =>
                  selectedCategories.has(String(id))
                );
                const parentSelected = selectedCategories.has(String(group.parent.category_id));
                const isGroupFullySelected = parentSelected && allChildrenSelected;

                return (
                  <div key={group.parent.category_id} className="border rounded-lg p-4">
                    {/* Parent Category */}
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id={`group-${group.parent.category_id}`}
                        checked={isGroupFullySelected}
                        onChange={() =>
                          toggleGroup(String(group.parent.category_id), childrenIds)
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`group-${group.parent.category_id}`}
                        className="ml-3 font-semibold text-lg cursor-pointer"
                      >
                        {group.parent.category_name}
                      </label>
                    </div>

                    {/* Children Categories */}
                    {group.children.length > 0 && (
                      <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                        {group.children.map((child) => (
                          <div key={child.category_id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`cat-${child.category_id}`}
                              checked={selectedCategories.has(String(child.category_id))}
                              onChange={() => toggleCategory(String(child.category_id))}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`cat-${child.category_id}`}
                              className="ml-3 cursor-pointer text-gray-700"
                            >
                              {child.category_name}
                              {child.path && (
                                <span className="text-xs text-gray-400 ml-2">
                                  ({child.path})
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Apply Filter ({selectedCategories.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}