"use client"

import type React from "react"
import { useState } from "react"
import { useMutation, useQueryClient } from "react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { boardsAPI } from "../services/api"
import { useToast } from "../hooks/use-toast"
import { Plus, Sparkles, Target, X } from 'lucide-react'

interface CreateBoardModalProps {
  onBoardCreated?: (board: any) => void
}

export function CreateBoardModal({ onBoardCreated }: CreateBoardModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createBoardMutation = useMutation(
    async (boardData: any) => {
      const response = await boardsAPI.createBoard(boardData)
      return response
    },
    {
      onSuccess: (data) => {
        // Invalidate and refetch boards list
        queryClient.invalidateQueries("boards")
        queryClient.invalidateQueries(["boards"])

        // Optionally, update the cache directly for immediate UI update
        queryClient.setQueryData("boards", (oldData: any) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: [data.data, ...oldData.data],
            }
          }
          return { data: [data.data] }
        })

        // Reset form and close modal
        setFormData({ name: "", description: "" })
        setIsOpen(false)

        // Call callback if provided
        onBoardCreated?.(data.data)

        toast({
          title: "Success! 🎉",
          description: "Board created successfully!",
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create board",
          variant: "destructive",
        })
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Hold on! ✋",
        description: "Your board needs a name to get started",
        variant: "destructive",
      })
      return
    }

    createBoardMutation.mutate(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          <Plus className="h-4 w-4 mr-2" />
          Create Board
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Create New Board</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Start organizing your tasks with style</p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
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
              onClick={() => setIsOpen(false)}
              disabled={createBoardMutation.isLoading}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBoardMutation.isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {createBoardMutation.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Magic...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Board
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
