'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { aedToFils } from '@/lib/utils'
import type { Employee } from '@/types/database'

interface EmployeeFormProps {
  employee: Employee | null
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || '',
    full_name: employee?.full_name || '',
    full_name_ar: employee?.full_name_ar || '',
    nationality: employee?.nationality || '',
    emirates_id: employee?.emirates_id?.replace(/-/g, '') || '',
    passport_no: employee?.passport_no || '',
    passport_expiry: employee?.passport_expiry || '',
    labour_card_no: employee?.labour_card_no || '',
    mohre_id: employee?.mohre_id || '',
    skill_level: employee?.skill_level || 1,
    joining_date: employee?.joining_date || new Date().toISOString().split('T')[0],
    department: employee?.department || '',
    designation: employee?.designation || '',
    basic_salary: employee ? employee.basic_salary / 100 : 0,
    housing_allowance: employee ? employee.housing_allowance / 100 : 0,
    transport_allowance: employee ? employee.transport_allowance / 100 : 0,
    other_allowances: employee ? employee.other_allowances / 100 : 0,
    bank_name: employee?.bank_name || '',
    iban: employee?.iban?.replace(/\s/g, '') || '',
    bank_routing_code: employee?.bank_routing_code || '',
    annual_leave_balance: employee?.annual_leave_balance || 30,
    sick_leave_balance: employee?.sick_leave_balance || 10,
    status: employee?.status || 'active',
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.employee_code || !formData.full_name || !formData.joining_date) {
        throw new Error('Please fill in all required fields')
      }

      // Validate Emirates ID format if provided
      if (formData.emirates_id && !/^784\d{12}$/.test(formData.emirates_id)) {
        throw new Error('Emirates ID must start with 784 and be 15 digits')
      }

      // Validate IBAN format if provided
      if (formData.iban && !/^AE\d{2}[A-Z0-9]{19}$/i.test(formData.iban)) {
        throw new Error('UAE IBAN must start with AE followed by 21 characters')
      }

      await onSubmit({
        employee_code: formData.employee_code,
        full_name: formData.full_name,
        full_name_ar: formData.full_name_ar || null,
        nationality: formData.nationality || null,
        emirates_id: formData.emirates_id || null,
        passport_no: formData.passport_no || null,
        passport_expiry: formData.passport_expiry || null,
        labour_card_no: formData.labour_card_no || null,
        mohre_id: formData.mohre_id || null,
        skill_level: Number(formData.skill_level),
        joining_date: formData.joining_date,
        department: formData.department || null,
        designation: formData.designation || null,
        basic_salary: aedToFils(formData.basic_salary),
        housing_allowance: aedToFils(formData.housing_allowance),
        transport_allowance: aedToFils(formData.transport_allowance),
        other_allowances: aedToFils(formData.other_allowances),
        bank_name: formData.bank_name || null,
        iban: formData.iban?.toUpperCase() || null,
        bank_routing_code: formData.bank_routing_code || null,
        annual_leave_balance: Number(formData.annual_leave_balance),
        sick_leave_balance: Number(formData.sick_leave_balance),
        status: formData.status,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nationalities = [
    'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
    'Egypt', 'Jordan', 'Lebanon', 'Syria', 'Palestine', 'Iraq',
    'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Philippines',
    'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'France',
    'South Africa', 'Nigeria', 'Kenya', 'Other'
  ]

  const departments = [
    'Administration', 'Finance', 'HR', 'IT', 'Marketing', 'Sales',
    'Operations', 'Production', 'Quality', 'Logistics', 'Procurement', 'Other'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_code">Employee Code *</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => handleChange('employee_code', e.target.value)}
                placeholder="EMP001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name_ar">Full Name (Arabic)</Label>
              <Input
                id="full_name_ar"
                value={formData.full_name_ar}
                onChange={(e) => handleChange('full_name_ar', e.target.value)}
                placeholder="جون دو"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Select
                value={formData.nationality}
                onValueChange={(value) => handleChange('nationality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map(nat => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emirates_id">Emirates ID</Label>
              <Input
                id="emirates_id"
                value={formData.emirates_id}
                onChange={(e) => handleChange('emirates_id', e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="784XXXXXXXXXXX"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">15 digits starting with 784</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport_no">Passport Number</Label>
              <Input
                id="passport_no"
                value={formData.passport_no}
                onChange={(e) => handleChange('passport_no', e.target.value)}
                placeholder="A12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passport_expiry">Passport Expiry</Label>
              <Input
                id="passport_expiry"
                type="date"
                value={formData.passport_expiry}
                onChange={(e) => handleChange('passport_expiry', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="work" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labour_card_no">Labour Card Number</Label>
              <Input
                id="labour_card_no"
                value={formData.labour_card_no}
                onChange={(e) => handleChange('labour_card_no', e.target.value)}
                placeholder="Required for WPS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mohre_id">MOHRE ID</Label>
              <Input
                id="mohre_id"
                value={formData.mohre_id}
                onChange={(e) => handleChange('mohre_id', e.target.value)}
                placeholder="Ministry ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="joining_date">Joining Date *</Label>
              <Input
                id="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={(e) => handleChange('joining_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill_level">Skill Level</Label>
              <Select
                value={String(formData.skill_level)}
                onValueChange={(value) => handleChange('skill_level', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(level => (
                    <SelectItem key={level} value={String(level)}>Level {level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="Job Title"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="annual_leave_balance">Annual Leave Balance (days)</Label>
              <Input
                id="annual_leave_balance"
                type="number"
                value={formData.annual_leave_balance}
                onChange={(e) => handleChange('annual_leave_balance', Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sick_leave_balance">Sick Leave Balance (days)</Label>
              <Input
                id="sick_leave_balance"
                type="number"
                value={formData.sick_leave_balance}
                onChange={(e) => handleChange('sick_leave_balance', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary (AED) *</Label>
              <Input
                id="basic_salary"
                type="number"
                value={formData.basic_salary}
                onChange={(e) => handleChange('basic_salary', Number(e.target.value))}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="housing_allowance">Housing Allowance (AED)</Label>
              <Input
                id="housing_allowance"
                type="number"
                value={formData.housing_allowance}
                onChange={(e) => handleChange('housing_allowance', Number(e.target.value))}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport_allowance">Transport Allowance (AED)</Label>
              <Input
                id="transport_allowance"
                type="number"
                value={formData.transport_allowance}
                onChange={(e) => handleChange('transport_allowance', Number(e.target.value))}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_allowances">Other Allowances (AED)</Label>
              <Input
                id="other_allowances"
                type="number"
                value={formData.other_allowances}
                onChange={(e) => handleChange('other_allowances', Number(e.target.value))}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Monthly Salary</span>
              <span className="text-2xl font-bold">
                AED {(
                  formData.basic_salary + 
                  formData.housing_allowance + 
                  formData.transport_allowance + 
                  formData.other_allowances
                ).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4 mt-4">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Bank details are required for WPS (Wages Protection System) salary payments via SIF file export.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Emirates NBD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_routing_code">Bank Routing Code</Label>
              <Input
                id="bank_routing_code"
                value={formData.bank_routing_code}
                onChange={(e) => handleChange('bank_routing_code', e.target.value)}
                placeholder="Required for WPS"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
              placeholder="AEXX XXXX XXXX XXXX XXXX XXX"
              maxLength={23}
            />
            <p className="text-xs text-muted-foreground">
              UAE IBAN: 23 characters starting with AE
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </form>
  )
}
