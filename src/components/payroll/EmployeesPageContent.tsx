'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { filsToAED, formatDate, formatDateForInput } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmployeeForm } from './EmployeeForm'
import { createEmployeeAction, updateEmployeeAction, deleteEmployeeAction } from '@/actions/index'
import { Plus, Search, Edit, UserX, Users, UserCheck, UserX2 } from 'lucide-react'
import type { Employee } from '@/types/database'

interface EmployeesPageContentProps {
  employees: Employee[]
  companyId: string
}

export function EmployeesPageContent({ employees: initialEmployees, companyId }: EmployeesPageContentProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.emirates_id?.includes(searchQuery) ?? false)
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    onLeave: employees.filter(e => e.status === 'on_leave').length,
    terminated: employees.filter(e => e.status === 'terminated').length,
  }

  const handleCreateEmployee = async (formData: any) => {
    const result = await createEmployeeAction(companyId, formData)
    if (result.error) {
      throw new Error(result.error)
    }
    setEmployees([...employees, result.data as Employee])
    setDialogOpen(false)
    router.refresh()
  }

  const handleUpdateEmployee = async (formData: any) => {
    if (!editingEmployee) return
    const result = await updateEmployeeAction(editingEmployee.id, formData)
    if (result.error) {
      throw new Error(result.error)
    }
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id ? (result.data as Employee) : emp
    ))
    setEditingEmployee(null)
    setDialogOpen(false)
    router.refresh()
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to terminate this employee?')) return
    const result = await deleteEmployeeAction(employeeId)
    if (result.error) {
      alert(result.error)
      return
    }
    setEmployees(employees.map(emp => 
      emp.id === employeeId ? { ...emp, status: 'terminated' as const } : emp
    ))
    router.refresh()
  }

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'on_leave':
        return <Badge variant="secondary">On Leave</Badge>
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <UserX2 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onLeave}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminated</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingEmployee(null)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
            </DialogHeader>
            <EmployeeForm
              employee={editingEmployee}
              onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
              onCancel={() => {
                setDialogOpen(false)
                setEditingEmployee(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Emirates ID</TableHead>
              <TableHead>Labour Card</TableHead>
              <TableHead className="text-right">Basic Salary</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No employees found. Add your first employee to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.employee_code}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employee.full_name}</div>
                      {employee.full_name_ar && (
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          {employee.full_name_ar}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {employee.emirates_id ? (
                      <>
                        {employee.emirates_id.slice(0, 3)}-{employee.emirates_id.slice(3, 7)}-
                        {employee.emirates_id.slice(7, 11)}-{employee.emirates_id.slice(11, 15)}
                      </>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {employee.labour_card_no || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {filsToAED(employee.basic_salary)}
                  </TableCell>
                  <TableCell>{employee.department || '-'}</TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingEmployee(employee)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {employee.status !== 'terminated' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
