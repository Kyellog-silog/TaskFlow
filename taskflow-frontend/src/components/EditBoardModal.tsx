"use client"

import React, { useState, useEffect } from "react"
import { useMutation } from "react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { boardsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { Edit, Save, X, Sparkles } from 'lucide-react'

interface EditBoardModalProps {
  board: any
  isOpen: boolean
  onClose: () => void
  onBoardUpdated: (board: any) => void
}

export function EditBoardModal({ board, isOpen, onClose, onBoardUpdated }: EditBoardModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const { toast } = useToast()

  // Initialize form data when board changes
  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name || "",
        description: board.description || "",
      })
    }
  }, [board])

  const updateBoardMutation = useMutation(
    async (boardData: any) => {
      const response = await boardsAPI.updateBoard(board.id, boardData)
      return response
    },
    {
      onSuccess: (data) => {
        onBoardUpdated(data.data)
        toast({
          title: "Success! ✨",
          description: "Board updated successfully",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update board",
          variant: "destructive",
        })
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Board name is required",
        variant: "destructive",
      })
      return
    }

    updateBoardMutation.mutate(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Board</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Update your board details</p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Board Name *</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter board name"
              required
              className="bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter board description (optional)"
              rows={3}
              className="bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateBoardMutation.isLoading}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateBoardMutation.isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {updateBoardMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Update Board
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
