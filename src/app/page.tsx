'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Church,
  Wallet,
  FileCheck2,
  Store,
  Hammer,
  Edit3,
  Check,
  X,
  Search,
  Filter,
  Flame,
  Star,
} from 'lucide-react'

type WeddingDetails = {
  id: string
  couple_names: string
  wedding_date: string
  church_venue: string
  reception_venue: string
  total_budget: number
}

type ChecklistTask = {
  id: string
  timeline: string
  timeline_order: number
  title: string
  completed: boolean
}

type BudgetItem = {
  id: string
  section: string
  category: string
  item_name: string
  supplier: string
  budget_allocation: number
  actual_cost: number
  paid_amount: number
  sort_order: number
}

type Supplier = {
  id: string
  category: string
  role_name: string
  supplier_name: string
  status: string
  notes: string
}

type PotentialSupplier = {
  id: string
  category: string
  supplier_name: string
  location: string
  rates: number
  communication: string
  notes: string
  shortlisted: boolean
}

type DiyProject = {
  id: string
  item_name: string
  status: string
  estimated_cost: number
  notes: string
}

type PreWeddingRequirement = {
  id: string
  requirement_name: string
  location: string
  necessary_requirements: string
  processing_time: string
  request_timing: string
  validity: string
  note: string
  completed: boolean
}

type Guest = {
  id: string
  full_name: string
  role: string
  confirmation: string
  food_cart_preference: string
  table_number: number | null
  notes: string
}

const TIMELINE_ORDER = [
  '12 Months',
  '11 Months',
  '10 Months',
  '9 Months',
  '8 Months',
  '7 Months',
  '6 Months',
  '5 Months',
  '4 Months',
  '3 Months',
  '2 Months',
  '1-2 Weeks',
]

const GUEST_ROLES = [
  'Immediate Family',
  'Guest',
  'Ninong',
  'Ninang',
  'Brides Maid',
  'Grooms Men',
  'Flower girl',
  'Ring Bearer',
]

const BUDGET_CATEGORIES = [
  'Brides Apparel',
  'Grooms Apparel',
  'Ceremony Favors',
  'Reception Favors',
  'Stationery',
  'Pre reception Carts',
  'After Party Carts',
  'Venue',
  'Other',
]

function formatPHP(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

function LanternIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M18 1V6" stroke="#D97706" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="11" y="6" width="14" height="3" rx="1.5" fill="#B45309" />
      <path
        d="M9 9C6 15 6 25 9 32H27C30 25 30 15 27 9H9Z"
        fill="url(#lanternGlow)"
        stroke="#F59E0B"
        strokeWidth="1.5"
      />
      <path d="M13 9C11.5 16 11.5 24 13 32" stroke="#FDE68A" strokeWidth="1" strokeOpacity="0.7" />
      <path d="M23 9C24.5 16 24.5 24 23 32" stroke="#FDE68A" strokeWidth="1" strokeOpacity="0.7" />
      <circle cx="18" cy="21" r="4" fill="#FEF3C7" />
      <rect x="11" y="32" width="14" height="3" rx="1.5" fill="#B45309" />
      <path d="M16 35L15 41M18 35V42M20 35L21 41" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" />
      <defs>
        <radialGradient
          id="lanternGlow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(18 21) rotate(90) scale(13 11)"
        >
          <stop stopColor="#FEF3C7" />
          <stop offset="0.55" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export default function JomarAndJenilaWeddingPlanner() {
  const [details, setDetails] = useState<WeddingDetails | null>(null)
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [potentialSuppliers, setPotentialSuppliers] = useState<PotentialSupplier[]>([])
  const [diyProjects, setDiyProjects] = useState<DiyProject[]>([])
  const [requirements, setRequirements] = useState<PreWeddingRequirement[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<
    'overview' | 'checklist' | 'budget' | 'suppliers' | 'requirements' | 'guests'
  >('overview')

  // Editable Header / Total Budget Modal State
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerForm, setHeaderForm] = useState({
    couple_names: 'Jomar & Jenila',
    wedding_date: '2027-11-20',
    church_venue: 'Stella Maris Chapel',
    reception_venue: 'Sumlang Lake',
    total_budget: '500000',
  })

  // Checklist Filter & Add
  const [selectedTimeline, setSelectedTimeline] = useState<string>('All')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTimeline, setNewTaskTimeline] = useState('12 Months')

  // Budget Filter & Add & Inline Edit
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>('All')
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [editBudgetRow, setEditBudgetRow] = useState<{
    supplier: string
    budget_allocation: string
    actual_cost: string
    paid_amount: string
  }>({ supplier: '', budget_allocation: '0', actual_cost: '0', paid_amount: '0' })

  const [newBudgetCategory, setNewBudgetCategory] = useState('Brides Apparel')
  const [newBudgetItemName, setNewBudgetItemName] = useState('')
  const [newBudgetSupplier, setNewBudgetSupplier] = useState('')
  const [newBudgetAllocation, setNewBudgetAllocation] = useState('')
  const [newBudgetActual, setNewBudgetActual] = useState('')

  // Suppliers & Potential Suppliers & DIY states
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState<string>('All')
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<string>('All')
  const [supplierSearch, setSupplierSearch] = useState<string>('')
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false)
  const [newSupplierCategory, setNewSupplierCategory] = useState('Church Ceremony')
  const [customSupplierCategory, setCustomSupplierCategory] = useState('')
  const [newSupplierRole, setNewSupplierRole] = useState('')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierNotes, setNewSupplierNotes] = useState('')
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
  const [editSupplierRow, setEditSupplierRow] = useState<{
    category: string
    role_name: string
    supplier_name: string
    status: string
    notes: string
  }>({ category: '', role_name: '', supplier_name: '', status: 'Searching', notes: '' })

  // Potential Suppliers Filter, Custom Categories & Inline Edit
  const [potCategoryFilter, setPotCategoryFilter] = useState<string>('All')
  const [potSearch, setPotSearch] = useState<string>('')
  const [potShortlistedOnly, setPotShortlistedOnly] = useState<boolean>(false)
  const [showAddPotForm, setShowAddPotForm] = useState(false)
  const [customPotCategories, setCustomPotCategories] = useState<string[]>([
    'HMUA',
    'Photo & Video',
    'Bride & Groom Wedding Ceremony Outfit',
    'Catering & Styling',
    'Florist & Decor',
    'Food Carts & Mobile Bar',
    'Lights, Sounds & Band',
    'Host / Emcee',
    'Souvenirs & Invitations',
  ])
  const [isAddingNewPotCategory, setIsAddingNewPotCategory] = useState(false)
  const [newCustomPotCategoryName, setNewCustomPotCategoryName] = useState('')

  const [newPotCategory, setNewPotCategory] = useState('HMUA')
  const [newPotName, setNewPotName] = useState('')
  const [newPotLocation, setNewPotLocation] = useState('')
  const [newPotRates, setNewPotRates] = useState('')
  const [newPotComm, setNewPotComm] = useState('Inquired')
  const [newPotNotes, setNewPotNotes] = useState('')

  const [editingPotId, setEditingPotId] = useState<string | null>(null)
  const [editPotRow, setEditPotRow] = useState<{
    category: string
    supplier_name: string
    location: string
    rates: string
    communication: string
    notes: string
  }>({
    category: '',
    supplier_name: '',
    location: '',
    rates: '0',
    communication: 'Inquired',
    notes: '',
  })

  const [newDiyName, setNewDiyName] = useState('')
  const [newDiyCost, setNewDiyCost] = useState('')

  // Guests Filter & Add
  const [guestSearch, setGuestSearch] = useState('')
  const [guestRoleFilter, setGuestRoleFilter] = useState('All')
  const [guestStatusFilter, setGuestStatusFilter] = useState('All')
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestRole, setNewGuestRole] = useState('Guest')
  const [newGuestConfirmation, setNewGuestConfirmation] = useState('No Confirmation')

  async function fetchAllData() {
    setLoading(true)
    const [
      detailsRes,
      tasksRes,
      budgetRes,
      suppliersRes,
      potSuppliersRes,
      diyRes,
      reqRes,
      guestsRes,
    ] = await Promise.all([
      supabase.from('jj_wedding_details').select('*').limit(1).single(),
      supabase
        .from('jj_checklist_tasks')
        .select('*')
        .order('timeline_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase.from('jj_budget_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('jj_suppliers').select('*').order('created_at', { ascending: true }),
      supabase.from('jj_potential_suppliers').select('*').order('created_at', { ascending: true }),
      supabase.from('jj_diy_projects').select('*').order('created_at', { ascending: true }),
      supabase
        .from('jj_pre_wedding_requirements')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase.from('jj_guests').select('*').order('created_at', { ascending: true }),
    ])

    if (detailsRes.data) {
      setDetails(detailsRes.data)
      setHeaderForm({
        couple_names: detailsRes.data.couple_names,
        wedding_date: detailsRes.data.wedding_date,
        church_venue: detailsRes.data.church_venue,
        reception_venue: detailsRes.data.reception_venue,
        total_budget: String(detailsRes.data.total_budget),
      })
    }
    if (tasksRes.data) setTasks(tasksRes.data)
    if (budgetRes.data) setBudgetItems(budgetRes.data)
    if (suppliersRes.data) setSuppliers(suppliersRes.data)
    if (potSuppliersRes.data) setPotentialSuppliers(potSuppliersRes.data)
    if (diyRes.data) setDiyProjects(diyRes.data)
    if (reqRes.data) setRequirements(reqRes.data)
    if (guestsRes.data) setGuests(guestsRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  // Save Wedding Details & Total Budget
  async function saveHeaderDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!details) return
    const updatedBudget = Number(headerForm.total_budget) || 0
    const updated = {
      ...details,
      couple_names: headerForm.couple_names,
      wedding_date: headerForm.wedding_date,
      church_venue: headerForm.church_venue,
      reception_venue: headerForm.reception_venue,
      total_budget: updatedBudget,
    }
    setDetails(updated)
    setEditingHeader(false)
    await supabase
      .from('jj_wedding_details')
      .update({
        couple_names: updated.couple_names,
        wedding_date: updated.wedding_date,
        church_venue: updated.church_venue,
        reception_venue: updated.reception_venue,
        total_budget: updated.total_budget,
      })
      .eq('id', details.id)
  }

  // Checklist Handlers
  async function toggleChecklistTask(task: ChecklistTask) {
    const nextVal = !task.completed
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextVal } : t)))
    await supabase.from('jj_checklist_tasks').update({ completed: nextVal }).eq('id', task.id)
  }

  async function addChecklistTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    const orderIdx = TIMELINE_ORDER.indexOf(newTaskTimeline) + 1 || 1
    const { data } = await supabase
      .from('jj_checklist_tasks')
      .insert([
        {
          timeline: newTaskTimeline,
          timeline_order: orderIdx,
          title: newTaskTitle.trim(),
          completed: false,
        },
      ])
      .select()
      .single()
    if (data) {
      setTasks((prev) => [...prev, data])
      setNewTaskTitle('')
    }
  }

  async function deleteChecklistTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('jj_checklist_tasks').delete().eq('id', id)
  }

  // Budget Handlers
  function startEditingBudget(item: BudgetItem) {
    setEditingBudgetId(item.id)
    setEditBudgetRow({
      supplier: item.supplier || '',
      budget_allocation: String(item.budget_allocation || 0),
      actual_cost: String(item.actual_cost || 0),
      paid_amount: String(item.paid_amount || 0),
    })
  }

  async function saveBudgetRow(id: string) {
    const allocation = Number(editBudgetRow.budget_allocation) || 0
    const actual = Number(editBudgetRow.actual_cost) || 0
    const paid = Number(editBudgetRow.paid_amount) || 0

    setBudgetItems((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              supplier: editBudgetRow.supplier,
              budget_allocation: allocation,
              actual_cost: actual,
              paid_amount: paid,
            }
          : b
      )
    )
    setEditingBudgetId(null)
    await supabase
      .from('jj_budget_items')
      .update({
        supplier: editBudgetRow.supplier,
        budget_allocation: allocation,
        actual_cost: actual,
        paid_amount: paid,
      })
      .eq('id', id)
  }

  async function addBudgetItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newBudgetItemName.trim()) return
    const isVendorSection = ['Pre reception Carts', 'After Party Carts', 'Venue', 'Other'].includes(
      newBudgetCategory
    )
    const { data } = await supabase
      .from('jj_budget_items')
      .insert([
        {
          section: isVendorSection ? 'Vendors' : 'Expenses',
          category: newBudgetCategory,
          item_name: newBudgetItemName.trim(),
          supplier: newBudgetSupplier.trim(),
          budget_allocation: Number(newBudgetAllocation) || 0,
          actual_cost: Number(newBudgetActual) || 0,
          paid_amount: 0,
          sort_order: budgetItems.length + 1,
        },
      ])
      .select()
      .single()
    if (data) {
      setBudgetItems((prev) => [...prev, data])
      setNewBudgetItemName('')
      setNewBudgetSupplier('')
      setNewBudgetAllocation('')
      setNewBudgetActual('')
    }
  }

  async function deleteBudgetItem(id: string) {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('jj_budget_items').delete().eq('id', id)
  }

  // Supplier & Potential Supplier & DIY Handlers
  async function updateSupplierField(id: string, field: keyof Supplier, value: string) {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
    await supabase.from('jj_suppliers').update({ [field]: value }).eq('id', id)
  }

  function startEditingSupplier(sup: Supplier) {
    setEditingSupplierId(sup.id)
    setEditSupplierRow({
      category: sup.category,
      role_name: sup.role_name,
      supplier_name: sup.supplier_name || '',
      status: sup.status || 'Searching',
      notes: sup.notes || '',
    })
  }

  async function saveSupplierRow(id: string) {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              category: editSupplierRow.category,
              role_name: editSupplierRow.role_name,
              supplier_name: editSupplierRow.supplier_name,
              status: editSupplierRow.status,
              notes: editSupplierRow.notes,
            }
          : s
      )
    )
    setEditingSupplierId(null)
    await supabase
      .from('jj_suppliers')
      .update({
        category: editSupplierRow.category,
        role_name: editSupplierRow.role_name,
        supplier_name: editSupplierRow.supplier_name,
        status: editSupplierRow.status,
        notes: editSupplierRow.notes,
      })
      .eq('id', id)
  }

  async function deleteSupplier(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
    await supabase.from('jj_suppliers').delete().eq('id', id)
  }

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!newSupplierRole.trim()) return
    const finalCat =
      newSupplierCategory === '__custom__' && customSupplierCategory.trim()
        ? customSupplierCategory.trim()
        : newSupplierCategory
    const { data } = await supabase
      .from('jj_suppliers')
      .insert([
        {
          category: finalCat,
          role_name: newSupplierRole.trim(),
          supplier_name: newSupplierName.trim(),
          status: newSupplierName.trim() ? 'Booked' : 'Searching',
          notes: newSupplierNotes.trim(),
        },
      ])
      .select()
      .single()
    if (data) {
      setSuppliers((prev) => [...prev, data])
      setNewSupplierRole('')
      setNewSupplierName('')
      setNewSupplierNotes('')
      setCustomSupplierCategory('')
      setShowAddSupplierForm(false)
    }
  }

  function handleAddCustomPotCategory() {
    const trimmed = newCustomPotCategoryName.trim()
    if (!trimmed) return
    if (!customPotCategories.includes(trimmed)) {
      setCustomPotCategories((prev) => [...prev, trimmed])
    }
    setNewPotCategory(trimmed)
    setNewCustomPotCategoryName('')
    setIsAddingNewPotCategory(false)
  }

  async function addPotentialSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!newPotName.trim()) return
    const finalCat =
      isAddingNewPotCategory && newCustomPotCategoryName.trim()
        ? newCustomPotCategoryName.trim()
        : newPotCategory
    if (!customPotCategories.includes(finalCat)) {
      setCustomPotCategories((prev) => [...prev, finalCat])
    }
    const { data } = await supabase
      .from('jj_potential_suppliers')
      .insert([
        {
          category: finalCat,
          supplier_name: newPotName.trim(),
          location: newPotLocation.trim(),
          rates: Number(newPotRates) || 0,
          communication: newPotComm,
          notes: newPotNotes.trim(),
          shortlisted: false,
        },
      ])
      .select()
      .single()
    if (data) {
      setPotentialSuppliers((prev) => [...prev, data])
      setNewPotName('')
      setNewPotLocation('')
      setNewPotRates('')
      setNewPotNotes('')
      setNewCustomPotCategoryName('')
      setIsAddingNewPotCategory(false)
      setShowAddPotForm(false)
    }
  }

  function startEditingPotSupplier(pot: PotentialSupplier) {
    setEditingPotId(pot.id)
    setEditPotRow({
      category: pot.category,
      supplier_name: pot.supplier_name,
      location: pot.location || '',
      rates: String(pot.rates || 0),
      communication: pot.communication || 'Inquired',
      notes: pot.notes || '',
    })
  }

  async function savePotSupplierRow(id: string) {
    const numericRates = Number(editPotRow.rates) || 0
    if (editPotRow.category && !customPotCategories.includes(editPotRow.category)) {
      setCustomPotCategories((prev) => [...prev, editPotRow.category])
    }
    setPotentialSuppliers((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              category: editPotRow.category,
              supplier_name: editPotRow.supplier_name,
              location: editPotRow.location,
              rates: numericRates,
              communication: editPotRow.communication,
              notes: editPotRow.notes,
            }
          : p
      )
    )
    setEditingPotId(null)
    await supabase
      .from('jj_potential_suppliers')
      .update({
        category: editPotRow.category,
        supplier_name: editPotRow.supplier_name,
        location: editPotRow.location,
        rates: numericRates,
        communication: editPotRow.communication,
        notes: editPotRow.notes,
      })
      .eq('id', id)
  }

  async function togglePotShortlist(pot: PotentialSupplier) {
    const nextVal = !pot.shortlisted
    setPotentialSuppliers((prev) =>
      prev.map((p) => (p.id === pot.id ? { ...p, shortlisted: nextVal } : p))
    )
    await supabase
      .from('jj_potential_suppliers')
      .update({ shortlisted: nextVal })
      .eq('id', pot.id)
  }

  async function deletePotentialSupplier(id: string) {
    setPotentialSuppliers((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('jj_potential_suppliers').delete().eq('id', id)
  }

  async function addDiyProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newDiyName.trim()) return
    const { data } = await supabase
      .from('jj_diy_projects')
      .insert([
        {
          item_name: newDiyName.trim(),
          status: 'Idea',
          estimated_cost: Number(newDiyCost) || 0,
        },
      ])
      .select()
      .single()
    if (data) {
      setDiyProjects((prev) => [...prev, data])
      setNewDiyName('')
      setNewDiyCost('')
    }
  }

  async function updateDiyStatus(id: string, status: string) {
    setDiyProjects((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
    await supabase.from('jj_diy_projects').update({ status }).eq('id', id)
  }

  async function deleteDiyProject(id: string) {
    setDiyProjects((prev) => prev.filter((d) => d.id !== id))
    await supabase.from('jj_diy_projects').delete().eq('id', id)
  }

  // Pre-Wedding Requirements Handlers
  async function toggleRequirement(req: PreWeddingRequirement) {
    const nextVal = !req.completed
    setRequirements((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, completed: nextVal } : r))
    )
    await supabase
      .from('jj_pre_wedding_requirements')
      .update({ completed: nextVal })
      .eq('id', req.id)
  }

  // Guest Handlers
  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!newGuestName.trim()) return
    const { data } = await supabase
      .from('jj_guests')
      .insert([
        {
          full_name: newGuestName.trim(),
          role: newGuestRole,
          confirmation: newGuestConfirmation,
        },
      ])
      .select()
      .single()
    if (data) {
      setGuests((prev) => [...prev, data])
      setNewGuestName('')
    }
  }

  async function updateGuestConfirmation(id: string, confirmation: string) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, confirmation } : g)))
    await supabase.from('jj_guests').update({ confirmation }).eq('id', id)
  }

  async function updateGuestRole(id: string, role: string) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, role } : g)))
    await supabase.from('jj_guests').update({ role }).eq('id', id)
  }

  async function deleteGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id))
    await supabase.from('jj_guests').delete().eq('id', id)
  }

  // Computed Metrics
  const totalBudget = Number(details?.total_budget ?? 500000)
  const totalAllocated = useMemo(
    () => budgetItems.reduce((sum, i) => sum + Number(i.budget_allocation || 0), 0),
    [budgetItems]
  )
  const totalActual = useMemo(
    () => budgetItems.reduce((sum, i) => sum + Number(i.actual_cost || 0), 0),
    [budgetItems]
  )
  const totalPaid = useMemo(
    () => budgetItems.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0),
    [budgetItems]
  )
  const unallocatedBudget = totalBudget - totalAllocated
  const totalBalance = (totalActual > 0 ? totalActual : totalAllocated) - totalPaid

  const completedTasksCount = tasks.filter((t) => t.completed).length
  const checklistPercent =
    tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0

  const confirmedGuestsCount = guests.filter((g) => g.confirmation === 'Confirmed').length
  const pendingGuestsCount = guests.filter((g) => g.confirmation === 'No Confirmation').length
  const declinedGuestsCount = guests.filter((g) => g.confirmation === 'Not Going').length

  const completedReqsCount = requirements.filter((r) => r.completed).length

  const [daysUntilWedding, setDaysUntilWedding] = useState<number>(399)

  useEffect(() => {
    const target = details?.wedding_date ? new Date(details.wedding_date) : new Date('2027-11-20')
    const diff = target.getTime() - Date.now()
    setDaysUntilWedding(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))
  }, [details?.wedding_date])

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesName = g.full_name.toLowerCase().includes(guestSearch.toLowerCase())
      const matchesRole = guestRoleFilter === 'All' || g.role === guestRoleFilter
      const matchesStatus = guestStatusFilter === 'All' || g.confirmation === guestStatusFilter
      return matchesName && matchesRole && matchesStatus
    })
  }, [guests, guestSearch, guestRoleFilter, guestStatusFilter])

  const filteredBudgetItems = useMemo(() => {
    if (selectedBudgetCategory === 'All') return budgetItems
    return budgetItems.filter((b) => b.category === selectedBudgetCategory)
  }, [budgetItems, selectedBudgetCategory])

  // Dynamic Supplier Categories & Filtered List
  const allSupplierCategories = useMemo(() => {
    const base = ['Church Ceremony', 'Reception', 'Reception Carts', 'After Party', 'Coordination']
    const fromData = suppliers.map((s) => s.category).filter(Boolean)
    return Array.from(new Set([...base, ...fromData]))
  }, [suppliers])

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchCat = supplierCategoryFilter === 'All' || s.category === supplierCategoryFilter
      const matchStatus = supplierStatusFilter === 'All' || s.status === supplierStatusFilter
      const q = supplierSearch.toLowerCase()
      const matchSearch =
        !q ||
        s.role_name.toLowerCase().includes(q) ||
        (s.supplier_name || '').toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q)
      return matchCat && matchStatus && matchSearch
    })
  }, [suppliers, supplierCategoryFilter, supplierStatusFilter, supplierSearch])

  // Dynamic Potential Supplier Categories & Filtered List
  const allPotentialCategories = useMemo(() => {
    const fromData = potentialSuppliers.map((p) => p.category).filter(Boolean)
    return Array.from(new Set([...customPotCategories, ...fromData]))
  }, [customPotCategories, potentialSuppliers])

  const filteredPotentialSuppliers = useMemo(() => {
    return potentialSuppliers.filter((p) => {
      const matchCat = potCategoryFilter === 'All' || p.category === potCategoryFilter
      const matchStar = !potShortlistedOnly || p.shortlisted
      const q = potSearch.toLowerCase()
      const matchSearch =
        !q ||
        p.supplier_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      return matchCat && matchStar && matchSearch
    })
  }, [potentialSuppliers, potCategoryFilter, potShortlistedOnly, potSearch])

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#2D223B] pb-20">
      {/* Decorative Lavender & Floating Lanterns Hero Banner */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#2E1C44] via-[#4A2E6E] to-[#6B469B] text-white border-b border-purple-300/20 shadow-lg">
        {/* Soft Ambient Lantern Glow Orbs */}
        <div className="pointer-events-none absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-purple-300/20 blur-3xl" />

        {/* Floating Lanterns SVG Decorations */}
        <div className="pointer-events-none absolute top-4 right-8 hidden lg:flex items-start gap-6 opacity-90">
          <div className="animate-lantern lantern-glow">
            <LanternIcon className="w-9 h-11" />
          </div>
          <div className="animate-lantern-delayed lantern-glow mt-6">
            <LanternIcon className="w-7 h-9" />
          </div>
          <div className="animate-lantern lantern-glow mt-2">
            <LanternIcon className="w-8 h-10" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-medium tracking-wide">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Lavender & Floating Lanterns Wedding Tracker</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-4">
                <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-xs">
                  {details?.couple_names || 'Jomar & Jenila'}
                </h1>
                <button
                  onClick={() => setEditingHeader(!editingHeader)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-purple-100 border border-white/20 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Budget & Details
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-purple-100/90 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-300" />
                  <strong className="text-white">{details?.wedding_date || '2027-11-20'}</strong>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-medium border border-amber-300/30">
                    {daysUntilWedding} days to go
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Church className="w-4 h-4 text-purple-200" />
                  Church: <strong className="text-white">{details?.church_venue || 'Stella Maris Chapel'}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-300" />
                  Reception: <strong className="text-white">{details?.reception_venue || 'Sumlang Lake'}</strong>
                </span>
              </div>
            </div>

            {/* Live Philippine Peso Budget Allocation Pill */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[300px] sm:min-w-[360px]">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-purple-200 mb-1">
                <span>Total Wedding Budget (PHP)</span>
                <span className="text-amber-300 font-semibold">
                  {Math.round((totalAllocated / Math.max(totalBudget, 1)) * 100)}% Allocated
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-2xl sm:text-3xl font-bold text-white">{formatPHP(totalBudget)}</p>
                <p className="text-xs text-purple-200">
                  Unallocated:{' '}
                  <span className="font-semibold text-amber-200">{formatPHP(unallocatedBudget)}</span>
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-purple-950/60 overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-purple-300 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((totalAllocated / Math.max(totalBudget, 1)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-purple-200 mt-2">
                <span>Allocated: {formatPHP(totalAllocated)}</span>
                <span>Actual: {formatPHP(totalActual)}</span>
                <span>Paid: {formatPHP(totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Inline Editor Drawer for Wedding Details & Total PHP Budget */}
          {editingHeader && (
            <form
              onSubmit={saveHeaderDetails}
              className="mt-5 p-4 rounded-2xl bg-white/15 backdrop-blur-lg border border-white/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
            >
              <div>
                <label className="block text-xs text-purple-100 mb-1">Couple Names</label>
                <input
                  type="text"
                  value={headerForm.couple_names}
                  onChange={(e) => setHeaderForm({ ...headerForm, couple_names: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-100 mb-1">Wedding Date</label>
                <input
                  type="date"
                  value={headerForm.wedding_date}
                  onChange={(e) => setHeaderForm({ ...headerForm, wedding_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-100 mb-1">Church Venue</label>
                <input
                  type="text"
                  value={headerForm.church_venue}
                  onChange={(e) => setHeaderForm({ ...headerForm, church_venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-purple-100 mb-1">Reception Venue</label>
                <input
                  type="text"
                  value={headerForm.reception_venue}
                  onChange={(e) =>
                    setHeaderForm({ ...headerForm, reception_venue: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-sm font-medium"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-amber-200 font-semibold mb-1">
                    Total Budget (₱)
                  </label>
                  <input
                    type="number"
                    value={headerForm.total_budget}
                    onChange={(e) => setHeaderForm({ ...headerForm, total_budget: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white text-stone-900 text-sm font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold text-sm transition self-end cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'checklist', label: `Checklist (${completedTasksCount}/${tasks.length})` },
                  { id: 'budget', label: 'Budget & Expenses (₱)' },
                  { id: 'suppliers', label: 'Suppliers, Carts & DIY' },
                  { id: 'requirements', label: `Requirements (${completedReqsCount}/${requirements.length})` },
                  { id: 'guests', label: `Guest List (${guests.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-[#4A2E6E] shadow-sm font-semibold'
                      : 'text-purple-100 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchAllData}
              title="Sync with Supabase"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 transition shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => setActiveTab('budget')}
            className="bg-white rounded-2xl p-5 border border-[#E6DEFA] shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
              <span>Budget & Allocation</span>
              <Wallet className="w-4 h-4 text-[#7C5CBF]" />
            </div>
            <p className="text-2xl font-bold text-[#2D223B] mt-2">{formatPHP(totalAllocated)}</p>
            <p className="text-xs text-[#6E5D85] mt-1">
              Allocated of {formatPHP(totalBudget)} •{' '}
              <span className="text-amber-600 font-medium">{formatPHP(unallocatedBudget)} free</span>
            </p>
          </div>

          <div
            onClick={() => setActiveTab('checklist')}
            className="bg-white rounded-2xl p-5 border border-[#E6DEFA] shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
              <span>Pre-Wedding Checklist</span>
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-[#2D223B] mt-2">
              {completedTasksCount}{' '}
              <span className="text-base font-normal text-[#8E7DA6]">/ {tasks.length} Tasks</span>
            </p>
            <div className="w-full h-1.5 bg-[#F3EEFF] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#7C5CBF] rounded-full"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('guests')}
            className="bg-white rounded-2xl p-5 border border-[#E6DEFA] shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
              <span>Guest List & Entourage</span>
              <Users className="w-4 h-4 text-[#7C5CBF]" />
            </div>
            <p className="text-2xl font-bold text-[#2D223B] mt-2">
              {guests.length} <span className="text-base font-normal text-[#8E7DA6]">Total Guests</span>
            </p>
            <p className="text-xs text-[#6E5D85] mt-1">
              <span className="text-emerald-600 font-semibold">{confirmedGuestsCount} Confirmed</span> •{' '}
              {pendingGuestsCount} Awaiting RSVP
            </p>
          </div>

          <div
            onClick={() => setActiveTab('requirements')}
            className="bg-white rounded-2xl p-5 border border-[#E6DEFA] shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
              <span>Church & Legal Docs</span>
              <FileCheck2 className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-[#2D223B] mt-2">
              {completedReqsCount}{' '}
              <span className="text-base font-normal text-[#8E7DA6]">
                / {requirements.length} Completed
              </span>
            </p>
            <p className="text-xs text-[#6E5D85] mt-1">
              CENOMAR, PSA, Kumpil, Banns & License
            </p>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Venue & Concept Highlight Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                    Wedding Concept & Venues
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#2D223B] mt-0.5">
                    Jomar & Jenila — Lavender & Floating Lanterns
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[#F3EEFF] text-[#6B469B] border border-[#DFD2FC]">
                  <Sparkles className="w-3.5 h-3.5" /> Nov 20, 2027
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E1FF]">
                  <div className="flex items-center gap-2 text-[#6B469B] font-semibold text-sm">
                    <Church className="w-4 h-4" />
                    <span>Church Ceremony Venue</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-[#2D223B] mt-1">
                    {details?.church_venue || 'Stella Maris Chapel'}
                  </p>
                  <p className="text-xs text-[#6E5D85] mt-1">
                    Includes Church Florist, Bride&apos;s Bouquet, Pianist/Violin, Preacher & Coaster Bus to Reception
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF8FF] to-[#FEF9EC] border border-amber-200/70">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <Flame className="w-4 h-4 fill-amber-400 text-amber-600" />
                    <span>Reception & After-Party Venue</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-[#2D223B] mt-1">
                    {details?.reception_venue || 'Sumlang Lake'}
                  </p>
                  <p className="text-xs text-[#6E5D85] mt-1">
                    Lavender & Lanterns lakefront reception + Matcha Cart, Claw Machine, Taho, Potato Corner & Mobile Bar
                  </p>
                </div>
              </div>

              {/* Current Budget Allocations Snapshot */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#2D223B]">
                    Active Budget Allocations (PHP)
                  </h3>
                  <button
                    onClick={() => setActiveTab('budget')}
                    className="text-xs font-semibold text-[#7C5CBF] hover:underline cursor-pointer"
                  >
                    Manage Full Budget ({budgetItems.length} items) →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F6F2FF] border border-[#E6DEFA]">
                    <span className="text-xs text-[#6E5D85]">Bridal Gown Allocation</span>
                    <p className="text-lg font-bold text-[#2D223B] mt-0.5">
                      {formatPHP(
                        budgetItems.find((b) => b.item_name === 'Gown')?.budget_allocation || 50000
                      )}
                    </p>
                    <span className="text-[11px] text-[#7C5CBF]">Bride&apos;s Apparel</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F2FF] border border-[#E6DEFA]">
                    <span className="text-xs text-[#6E5D85]">Coordinator (Rosa Bella)</span>
                    <p className="text-lg font-bold text-[#2D223B] mt-0.5">
                      {formatPHP(
                        budgetItems.find((b) => b.item_name === 'Coordinator')?.budget_allocation ||
                          39000
                      )}
                    </p>
                    <span className="text-[11px] text-[#7C5CBF]">Booked Vendor</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                    <span className="text-xs text-amber-800">Remaining Unallocated</span>
                    <p className="text-lg font-bold text-amber-900 mt-0.5">
                      {formatPHP(unallocatedBudget)}
                    </p>
                    <span className="text-[11px] text-amber-700">
                      Ready to allocate across categories
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Breakdown & DIY Quick Card */}
            <div className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-xl font-bold text-[#2D223B]">
                    Entourage & Guest Breakdown
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F3EEFF] text-[#6B469B]">
                    {guests.length} Total
                  </span>
                </div>
                <div className="space-y-2">
                  {GUEST_ROLES.map((role) => {
                    const count = guests.filter((g) => g.role === role).length
                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#FAF8FF] border border-[#EFE9FF]"
                      >
                        <span className="font-medium text-[#2D223B]">{role}</span>
                        <span className="font-bold text-[#7C5CBF]">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE9FF]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                    Do It Your Own (DIY) Projects
                  </h4>
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className="text-xs text-[#7C5CBF] hover:underline cursor-pointer"
                  >
                    Edit →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {diyProjects.map((diy) => (
                    <span
                      key={diy.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#F3EEFF] text-[#4A2E6E] border border-[#E2D6FC]"
                    >
                      {diy.item_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. PRE-WEDDING CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                  12-Month Countdown Roadmap
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                  Pre-Wedding Checklist ({completedTasksCount} of {tasks.length} Completed)
                </h2>
              </div>

              <form onSubmit={addChecklistTask} className="flex flex-wrap items-center gap-2">
                <select
                  value={newTaskTimeline}
                  onChange={(e) => setNewTaskTimeline(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#D8CBF8] bg-[#FAF8FF] text-[#2D223B]"
                >
                  {TIMELINE_ORDER.map((tl) => (
                    <option key={tl} value={tl}>
                      {tl}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Add new checklist milestone..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#D8CBF8] bg-white min-w-[220px]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#6B469B] hover:bg-[#583585] text-white transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </form>
            </div>

            {/* 100% Completion Goal Loading Bar */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF8FF] via-[#F3EEFF] to-[#FEF9EC] border border-[#E2D6FC] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B469B]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Wedding Readiness Goal: 100% Completion</span>
                  </div>
                  <p className="text-xs text-[#6E5D85] mt-0.5">
                    Every new task you add automatically updates your total milestone goal ({completedTasksCount} completed,{' '}
                    {Math.max(0, tasks.length - completedTasksCount)} remaining out of {tasks.length} total tasks).
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#4A2E6E]">
                    {checklistPercent}%
                  </span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                    Goal: 100%
                  </span>
                </div>
              </div>

              <div className="relative w-full h-4 rounded-full bg-white border border-[#D8CBF8] overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6B469B] via-[#8B63C7] to-amber-400 transition-all duration-500 ease-out"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-[#6E5D85]">
                <span>0% Start</span>
                <span>25%</span>
                <span>50% Halfway</span>
                <span>75%</span>
                <span className="text-[#4A2E6E] font-bold">100% Wedding Ready ({tasks.length} Tasks)</span>
              </div>
            </div>

            {/* Timeline Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedTimeline('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedTimeline === 'All'
                    ? 'bg-[#6B469B] text-white'
                    : 'bg-[#F3EEFF] text-[#5B4678] hover:bg-[#E7DDFC]'
                }`}
              >
                All Timelines ({tasks.length})
              </button>
              {TIMELINE_ORDER.map((tl) => {
                const tlTasks = tasks.filter((t) => t.timeline === tl)
                const tlDone = tlTasks.filter((t) => t.completed).length
                return (
                  <button
                    key={tl}
                    onClick={() => setSelectedTimeline(tl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedTimeline === tl
                        ? 'bg-[#6B469B] text-white'
                        : 'bg-[#F3EEFF] text-[#5B4678] hover:bg-[#E7DDFC]'
                    }`}
                  >
                    {tl} ({tlDone}/{tlTasks.length})
                  </button>
                )
              })}
            </div>

            {/* Grouped Timeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TIMELINE_ORDER.filter(
                (tl) => selectedTimeline === 'All' || selectedTimeline === tl
              ).map((tl) => {
                const groupTasks = tasks.filter((t) => t.timeline === tl)
                const doneCount = groupTasks.filter((t) => t.completed).length
                const groupPercent =
                  groupTasks.length > 0 ? Math.round((doneCount / groupTasks.length) * 100) : 0
                return (
                  <div
                    key={tl}
                    className="rounded-2xl border border-[#E9E1FF] bg-[#FAF8FF] p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="pb-2.5 mb-3 border-b border-[#E6DEFA] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                groupPercent === 100 ? 'bg-emerald-500' : 'bg-amber-400'
                              }`}
                            />
                            <h3 className="font-serif text-lg font-bold text-[#2D223B]">{tl}</h3>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#6B469B] border border-[#E6DEFA]">
                            {doneCount}/{groupTasks.length} ({groupPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white overflow-hidden border border-[#E6DEFA]">
                          <div
                            className="h-full bg-gradient-to-r from-[#7C5CBF] to-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${groupPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {groupTasks.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-start justify-between gap-2 p-2 rounded-xl bg-white border border-[#EFE9FF] hover:border-[#C9B3F9] transition"
                          >
                            <button
                              onClick={() => toggleChecklistTask(task)}
                              className="flex items-start gap-2.5 text-left flex-1 cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#6B469B] shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#B5A4CC] shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`text-xs leading-relaxed ${
                                  task.completed
                                    ? 'line-through text-[#9A89B3]'
                                    : 'text-[#2D223B] font-medium'
                                }`}
                              >
                                {task.title}
                              </span>
                            </button>
                            <button
                              onClick={() => deleteChecklistTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                              title="Remove task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 2. WEDDING BUDGET & EXPENSE TRACKER TAB (PHP) */}
        {activeTab === 'budget' && (
          <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                  Philippine Peso (₱) Dynamic Allocation Tracker
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                  Wedding Budget & Vendor Expenses
                </h2>
                <p className="text-xs text-[#6E5D85] mt-0.5">
                  Click any row&apos;s <strong>Edit</strong> button to allocate budget, assign a supplier, or update actual &amp; paid amounts.
                </p>
              </div>

              {/* Add New Expense / Vendor Item */}
              <form onSubmit={addBudgetItem} className="flex flex-wrap items-center gap-2">
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-[#FAF8FF]"
                >
                  {BUDGET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Item name..."
                  value={newBudgetItemName}
                  onChange={(e) => setNewBudgetItemName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] w-36"
                />
                <input
                  type="text"
                  placeholder="Supplier (optional)"
                  value={newBudgetSupplier}
                  onChange={(e) => setNewBudgetSupplier(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] w-36"
                />
                <input
                  type="number"
                  placeholder="Allocation ₱"
                  value={newBudgetAllocation}
                  onChange={(e) => setNewBudgetAllocation(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] w-28"
                />
                <input
                  type="number"
                  placeholder="Actual ₱"
                  value={newBudgetActual}
                  onChange={(e) => setNewBudgetActual(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] w-28"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] text-white hover:bg-[#583585] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </form>
            </div>

            {/* Budget Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#FAF8FF] border border-[#E6DEFA]">
              <div>
                <span className="text-[11px] uppercase text-[#7C5CBF] font-semibold">
                  Total Budget
                </span>
                <p className="text-lg font-bold text-[#2D223B]">{formatPHP(totalBudget)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase text-[#7C5CBF] font-semibold">
                  Total Allocated
                </span>
                <p className="text-lg font-bold text-[#6B469B]">{formatPHP(totalAllocated)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase text-amber-700 font-semibold">
                  Unallocated
                </span>
                <p className="text-lg font-bold text-amber-700">{formatPHP(unallocatedBudget)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase text-[#7C5CBF] font-semibold">
                  Actual Expenses
                </span>
                <p className="text-lg font-bold text-[#2D223B]">{formatPHP(totalActual)}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase text-emerald-700 font-semibold">
                  Paid / Balance
                </span>
                <p className="text-sm font-bold text-emerald-700">
                  {formatPHP(totalPaid)}{' '}
                  <span className="text-xs font-normal text-[#6E5D85]">
                    (Bal: {formatPHP(totalBalance)})
                  </span>
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedBudgetCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer ${
                  selectedBudgetCategory === 'All'
                    ? 'bg-[#6B469B] text-white'
                    : 'bg-[#F3EEFF] text-[#5B4678]'
                }`}
              >
                All Categories ({budgetItems.length})
              </button>
              {BUDGET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedBudgetCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap cursor-pointer ${
                    selectedBudgetCategory === cat
                      ? 'bg-[#6B469B] text-white'
                      : 'bg-[#F3EEFF] text-[#5B4678]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Budget Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DEFA] text-[11px] uppercase tracking-wider text-[#7C5CBF] bg-[#FAF8FF]">
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Overview / Item</th>
                    <th className="py-3 px-3">Supplier</th>
                    <th className="py-3 px-3 text-right">Budget Allocation</th>
                    <th className="py-3 px-3 text-right">Actual Cost</th>
                    <th className="py-3 px-3 text-right">Difference</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECFF] text-xs sm:text-sm">
                  {filteredBudgetItems.map((item) => {
                    const isEditing = editingBudgetId === item.id
                    const alloc = Number(item.budget_allocation || 0)
                    const actual = Number(item.actual_cost || 0)
                    const paid = Number(item.paid_amount || 0)
                    const difference = alloc - actual
                    const balance = (actual > 0 ? actual : alloc) - paid

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8FF] transition">
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-lg bg-[#F3EEFF] text-[#5B4678] text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#2D223B]">{item.item_name}</td>
                        <td className="py-3 px-3 text-[#5B4678]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editBudgetRow.supplier}
                              onChange={(e) =>
                                setEditBudgetRow({ ...editBudgetRow, supplier: e.target.value })
                              }
                              placeholder="Supplier name"
                              className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white w-36 text-xs"
                            />
                          ) : (
                            item.supplier || <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-[#2D223B]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editBudgetRow.budget_allocation}
                              onChange={(e) =>
                                setEditBudgetRow({
                                  ...editBudgetRow,
                                  budget_allocation: e.target.value,
                                })
                              }
                              className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white w-28 text-right text-xs"
                            />
                          ) : (
                            formatPHP(alloc)
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-[#2D223B]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editBudgetRow.actual_cost}
                              onChange={(e) =>
                                setEditBudgetRow({ ...editBudgetRow, actual_cost: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white w-28 text-right text-xs"
                            />
                          ) : (
                            formatPHP(actual)
                          )}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-semibold ${
                            difference < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatPHP(difference)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#5B4678]">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editBudgetRow.paid_amount}
                              onChange={(e) =>
                                setEditBudgetRow({ ...editBudgetRow, paid_amount: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white w-24 text-right text-xs"
                            />
                          ) : (
                            formatPHP(paid)
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-amber-800">
                          {formatPHP(balance)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => saveBudgetRow(item.id)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingBudgetId(null)}
                                className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => startEditingBudget(item)}
                                className="px-2.5 py-1 rounded-lg bg-[#F3EEFF] hover:bg-[#E5DAFC] text-[#6B469B] text-xs font-medium transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBudgetItem(item.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. SUPPLIERS, CARTS, POTENTIAL SUPPLIERS & DIY TAB */}
        {activeTab === 'suppliers' && (
          <div className="space-y-8">
            {/* Booked / Target Suppliers Roster — Modern Compact List View */}
            <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                    Church, Reception &amp; Food Carts
                  </span>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                      Wedding Suppliers Roster
                    </h2>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F3EEFF] text-[#6B469B]">
                      {suppliers.filter((s) => s.status === 'Booked').length}/{suppliers.length} Booked
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddSupplierForm(!showAddSupplierForm)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] hover:bg-[#583585] text-white transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddSupplierForm ? 'Close Form' : 'Add Supplier Role'}
                </button>
              </div>

              {/* Collapsible Add Supplier Role Drawer */}
              {showAddSupplierForm && (
                <form
                  onSubmit={addSupplier}
                  className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E2D6FC] flex flex-wrap items-end gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                      Category
                    </label>
                    <select
                      value={newSupplierCategory}
                      onChange={(e) => setNewSupplierCategory(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                    >
                      {allSupplierCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ New Category...</option>
                    </select>
                  </div>
                  {newSupplierCategory === '__custom__' && (
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        New Category Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Entourage Attire"
                        value={customSupplierCategory}
                        onChange={(e) => setCustomSupplierCategory(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-[#7C5CBF] bg-white w-40"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                      Role / Service Needed
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lights & Sounds"
                      value={newSupplierRole}
                      onChange={(e) => setNewSupplierRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                      Assigned Supplier (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank if still searching"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Package / remarks"
                      value={newSupplierNotes}
                      onChange={(e) => setNewSupplierNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] text-white hover:bg-[#583585] cursor-pointer"
                  >
                    Save Role
                  </button>
                </form>
              )}

              {/* Compact Filter & Search Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8FF] border border-[#EFE9FF]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setSupplierCategoryFilter('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      supplierCategoryFilter === 'All'
                        ? 'bg-[#6B469B] text-white shadow-2xs'
                        : 'bg-white text-[#5B4678] border border-[#E6DEFA] hover:bg-[#F3EEFF]'
                    }`}
                  >
                    All ({suppliers.length})
                  </button>
                  {allSupplierCategories.map((cat) => {
                    const count = suppliers.filter((s) => s.category === cat).length
                    return (
                      <button
                        key={cat}
                        onClick={() => setSupplierCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                          supplierCategoryFilter === cat
                            ? 'bg-[#6B469B] text-white shadow-2xs'
                            : 'bg-white text-[#5B4678] border border-[#E6DEFA] hover:bg-[#F3EEFF]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-[#7C5CBF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter role or supplier..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#D8CBF8] focus:outline-none focus:border-[#6B469B]"
                    />
                  </div>
                  <select
                    value={supplierStatusFilter}
                    onChange={(e) => setSupplierStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-white border border-[#D8CBF8] text-[#4A2E6E] font-medium"
                  >
                    <option value="All">All Status</option>
                    <option value="Booked">Booked</option>
                    <option value="Inquired">Inquired</option>
                    <option value="Searching">Searching</option>
                  </select>
                </div>
              </div>

              {/* Clean, Unbloated Modern List Table */}
              <div className="overflow-x-auto rounded-xl border border-[#EFE9FF]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6DEFA] text-[11px] uppercase tracking-wider text-[#7C5CBF] bg-[#FAF8FF]">
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Role / Service</th>
                      <th className="py-2.5 px-3.5">Assigned Supplier</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5">Notes</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4EFFF] text-xs sm:text-sm">
                    {filteredSuppliers.map((sup) => {
                      const isEditing = editingSupplierId === sup.id
                      return (
                        <tr key={sup.id} className="hover:bg-[#FAF8FF]/80 transition group">
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSupplierRow.category}
                                onChange={(e) =>
                                  setEditSupplierRow({
                                    ...editSupplierRow,
                                    category: e.target.value,
                                  })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-32"
                              />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#F3EEFF] text-[#5B4678] text-[11px] font-semibold">
                                {sup.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-[#2D223B]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSupplierRow.role_name}
                                onChange={(e) =>
                                  setEditSupplierRow({
                                    ...editSupplierRow,
                                    role_name: e.target.value,
                                  })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-full min-w-[140px]"
                              />
                            ) : (
                              sup.role_name
                            )}
                          </td>
                          <td className="py-2.5 px-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSupplierRow.supplier_name}
                                onChange={(e) =>
                                  setEditSupplierRow({
                                    ...editSupplierRow,
                                    supplier_name: e.target.value,
                                  })
                                }
                                placeholder="Assign supplier..."
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-full min-w-[150px]"
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder="Assign supplier..."
                                value={sup.supplier_name || ''}
                                onChange={(e) =>
                                  updateSupplierField(sup.id, 'supplier_name', e.target.value)
                                }
                                className="w-full max-w-[230px] px-2.5 py-1 rounded-lg bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E2D6FC] focus:border-[#6B469B] text-xs font-medium text-[#2D223B] placeholder:text-stone-400 focus:outline-none transition"
                              />
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <select
                              value={isEditing ? editSupplierRow.status : sup.status}
                              onChange={(e) =>
                                isEditing
                                  ? setEditSupplierRow({
                                      ...editSupplierRow,
                                      status: e.target.value,
                                    })
                                  : updateSupplierField(sup.id, 'status', e.target.value)
                              }
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                                (isEditing ? editSupplierRow.status : sup.status) === 'Booked'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : (isEditing ? editSupplierRow.status : sup.status) === 'Inquired'
                                  ? 'bg-purple-50 text-[#6B469B] border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="Booked">Booked</option>
                              <option value="Inquired">Inquired</option>
                              <option value="Searching">Searching</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3.5 text-xs text-[#6E5D85]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSupplierRow.notes}
                                onChange={(e) =>
                                  setEditSupplierRow({ ...editSupplierRow, notes: e.target.value })
                                }
                                placeholder="Add notes..."
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-full"
                              />
                            ) : (
                              sup.notes || <span className="text-stone-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => saveSupplierRow(sup.id)}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSupplierId(null)}
                                  className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => startEditingSupplier(sup)}
                                  className="px-2 py-1 rounded-lg bg-[#F3EEFF] hover:bg-[#E5DAFC] text-[#6B469B] text-xs font-medium transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSupplier(sup.id)}
                                  className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                                  title="Delete role"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#8E7DA6]">
                          No supplier roles match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Potential Suppliers Comparison Sheet — Custom Categories, Filterable & Inline Editable */}
            <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                    Vendor Comparison &amp; Canvassing Sheet
                  </span>
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                      Potential Suppliers Directory
                    </h2>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#F3EEFF] text-[#6B469B]">
                      {filteredPotentialSuppliers.length} of {potentialSuppliers.length} Shown
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingNewPotCategory(!isAddingNewPotCategory)
                      setShowAddPotForm(true)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F3EEFF] hover:bg-[#E5DAFC] text-[#6B469B] border border-[#D8CBF8] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Category
                  </button>
                  <button
                    onClick={() => setShowAddPotForm(!showAddPotForm)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] hover:bg-[#583585] text-white transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddPotForm ? 'Close Form' : 'Add Supplier Option'}
                  </button>
                </div>
              </div>

              {/* Collapsible Add Potential Supplier & Custom Category Drawer */}
              {showAddPotForm && (
                <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E2D6FC] space-y-3">
                  {isAddingNewPotCategory && (
                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6DEFA]">
                      <span className="text-xs font-semibold text-[#6B469B]">
                        Create Custom Category:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Photobooth, Grazing Table, Souvenirs..."
                        value={newCustomPotCategoryName}
                        onChange={(e) => setNewCustomPotCategoryName(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-[#7C5CBF] bg-white min-w-[240px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPotCategory}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer"
                      >
                        Add Category to List
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewPotCategory(false)}
                        className="text-xs text-[#6E5D85] hover:underline px-2 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <form
                    onSubmit={addPotentialSupplier}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        Category
                      </label>
                      <select
                        value={newPotCategory}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setIsAddingNewPotCategory(true)
                          } else {
                            setNewPotCategory(e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                      >
                        {allPotentialCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__add_new__">+ Add Custom Category...</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        Potential Supplier Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Traje de Manila"
                        value={newPotName}
                        onChange={(e) => setNewPotName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Albay / Manila"
                        value={newPotLocation}
                        onChange={(e) => setNewPotLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        Quoted Rates (₱)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newPotRates}
                        onChange={(e) => setNewPotRates(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                        Communication Status
                      </label>
                      <select
                        value={newPotComm}
                        onChange={(e) => setNewPotComm(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                      >
                        <option value="To Inquire">To Inquire</option>
                        <option value="Inquired">Inquired</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Meeting Scheduled">Meeting Scheduled</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Booked">Booked</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold uppercase text-[#7C5CBF] mb-1">
                          Notes / Package
                        </label>
                        <input
                          type="text"
                          placeholder="Inclusions..."
                          value={newPotNotes}
                          onChange={(e) => setNewPotNotes(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] text-white hover:bg-[#583585] self-end cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Filter Bar to Prevent Page Bloat */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8FF] border border-[#EFE9FF]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setPotCategoryFilter('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      potCategoryFilter === 'All'
                        ? 'bg-[#6B469B] text-white shadow-2xs'
                        : 'bg-white text-[#5B4678] border border-[#E6DEFA] hover:bg-[#F3EEFF]'
                    }`}
                  >
                    All Categories ({potentialSuppliers.length})
                  </button>
                  {allPotentialCategories.map((cat) => {
                    const count = potentialSuppliers.filter((p) => p.category === cat).length
                    return (
                      <button
                        key={cat}
                        onClick={() => setPotCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                          potCategoryFilter === cat
                            ? 'bg-[#6B469B] text-white shadow-2xs'
                            : 'bg-white text-[#5B4678] border border-[#E6DEFA] hover:bg-[#F3EEFF]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPotShortlistedOnly(!potShortlistedOnly)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      potShortlistedOnly
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-[#5B4678] border-[#D8CBF8]'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        potShortlistedOnly ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
                      }`}
                    />
                    Shortlisted
                  </button>
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-[#7C5CBF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search supplier or city..."
                      value={potSearch}
                      onChange={(e) => setPotSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#D8CBF8] focus:outline-none focus:border-[#6B469B]"
                    />
                  </div>
                </div>
              </div>

              {/* Potential Suppliers Editable Comparison Table */}
              <div className="overflow-x-auto rounded-xl border border-[#EFE9FF]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6DEFA] text-[11px] uppercase text-[#7C5CBF] bg-[#FAF8FF]">
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Potential Supplier</th>
                      <th className="py-2.5 px-3.5">Location</th>
                      <th className="py-2.5 px-3.5 text-right">Rates (₱)</th>
                      <th className="py-2.5 px-3.5">Communication</th>
                      <th className="py-2.5 px-3.5">Notes</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECFF] text-xs sm:text-sm">
                    {filteredPotentialSuppliers.map((pot) => {
                      const isEditing = editingPotId === pot.id
                      return (
                        <tr key={pot.id} className="hover:bg-[#FAF8FF]/80 transition">
                          <td className="py-2.5 px-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                list="pot-category-options"
                                value={editPotRow.category}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, category: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-40"
                              />
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#F3EEFF] text-[#5B4678] text-[11px] font-semibold">
                                {pot.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-[#2D223B]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPotRow.supplier_name}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, supplier_name: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-full min-w-[160px]"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => togglePotShortlist(pot)}
                                  title="Toggle shortlist star"
                                  className="cursor-pointer"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      pot.shortlisted
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-stone-300 hover:text-amber-300'
                                    }`}
                                  />
                                </button>
                                <span>{pot.supplier_name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-[#5B4678]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPotRow.location}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, location: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-28"
                              />
                            ) : (
                              pot.location || '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-semibold text-[#2D223B]">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPotRow.rates}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, rates: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-28 text-right"
                              />
                            ) : (
                              formatPHP(pot.rates)
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-[#5B4678]">
                            {isEditing ? (
                              <select
                                value={editPotRow.communication}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, communication: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs"
                              >
                                <option value="To Inquire">To Inquire</option>
                                <option value="Inquired">Inquired</option>
                                <option value="Quoted">Quoted</option>
                                <option value="Meeting Scheduled">Meeting Scheduled</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Booked">Booked</option>
                              </select>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8FF] border border-[#E6DEFA] text-xs font-medium text-[#5B4678]">
                                {pot.communication || 'To Inquire'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-xs text-[#5B4678]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPotRow.notes}
                                onChange={(e) =>
                                  setEditPotRow({ ...editPotRow, notes: e.target.value })
                                }
                                className="px-2 py-1 rounded-lg border border-[#7C5CBF] bg-white text-xs w-full min-w-[150px]"
                              />
                            ) : (
                              pot.notes || '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => savePotSupplierRow(pot.id)}
                                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingPotId(null)}
                                  className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => startEditingPotSupplier(pot)}
                                  className="px-2 py-1 rounded-lg bg-[#F3EEFF] hover:bg-[#E5DAFC] text-[#6B469B] text-xs font-medium transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deletePotentialSupplier(pot.id)}
                                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredPotentialSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[#8E7DA6]">
                          No potential suppliers match your selected category or search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <datalist id="pot-category-options">
                  {allPotentialCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </section>

            {/* Do It Your Own (DIY) Section */}
            <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                    Personal Touches
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                    Do It Your Own (DIY) Projects
                  </h2>
                </div>
                <form onSubmit={addDiyProject} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New DIY project..."
                    value={newDiyName}
                    onChange={(e) => setNewDiyName(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8]"
                  />
                  <input
                    type="number"
                    placeholder="Est. Cost ₱"
                    value={newDiyCost}
                    onChange={(e) => setNewDiyCost(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] w-28"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] text-white cursor-pointer"
                  >
                    <Hammer className="w-3.5 h-3.5" /> Add DIY
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {diyProjects.map((diy) => (
                  <div
                    key={diy.id}
                    className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E9E1FF] flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-sm text-[#2D223B]">{diy.item_name}</h3>
                      <p className="text-xs text-[#6E5D85] mt-0.5">{diy.notes || 'DIY Item'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={diy.status}
                        onChange={(e) => updateDiyStatus(diy.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          diy.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : diy.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-white text-[#5B4678] border-[#D8CBF8]'
                        }`}
                      >
                        <option value="Idea">Idea</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => deleteDiyProject(diy.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 4. PRE-WEDDING REQUIREMENTS TAB */}
        {activeTab === 'requirements' && (
          <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                Church & Civil Marriage Documentation
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                Pre-Wedding Requirements Checklist
              </h2>
              <p className="text-xs text-[#6E5D85] mt-0.5">
                Track processing times, validity windows, and parish/city hall requirements for Stella Maris Chapel.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DEFA] text-[11px] uppercase text-[#7C5CBF] bg-[#FAF8FF]">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Document / Requirement</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Necessary Requirements</th>
                    <th className="py-3 px-4">Processing</th>
                    <th className="py-3 px-4">Request Timing</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECFF] text-xs sm:text-sm">
                  {requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAF8FF]">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleRequirement(req)}
                          className="cursor-pointer"
                        >
                          {req.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#B5A4CC]" />
                          )}
                        </button>
                      </td>
                      <td
                        className={`py-3.5 px-4 font-semibold ${
                          req.completed ? 'line-through text-stone-400' : 'text-[#2D223B]'
                        }`}
                      >
                        {req.requirement_name}
                      </td>
                      <td className="py-3.5 px-4 text-[#5B4678]">{req.location || '—'}</td>
                      <td className="py-3.5 px-4 text-[#5B4678]">
                        {req.necessary_requirements || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[#5B4678]">{req.processing_time || '—'}</td>
                      <td className="py-3.5 px-4 text-[#5B4678]">{req.request_timing || '—'}</td>
                      <td className="py-3.5 px-4 text-[#5B4678]">{req.validity || '—'}</td>
                      <td className="py-3.5 px-4 text-xs text-amber-800 bg-amber-50/50">
                        {req.note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. GUEST LIST & ENTOURAGE TAB (75 GUESTS) */}
        {activeTab === 'guests' && (
          <section className="bg-white rounded-2xl border border-[#E6DEFA] p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CBF]">
                  RSVP & Entourage Manager
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#2D223B]">
                  Guest List &amp; Entourage ({guests.length} Guests)
                </h2>
                <p className="text-xs text-[#6E5D85] mt-0.5">
                  Confirmed: <strong className="text-emerald-700">{confirmedGuestsCount}</strong> •
                  No Confirmation: <strong className="text-amber-700">{pendingGuestsCount}</strong>{' '}
                  • Not Going: <strong className="text-rose-700">{declinedGuestsCount}</strong>
                </p>
              </div>

              <form onSubmit={addGuest} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Guest full name..."
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8]"
                />
                <select
                  value={newGuestRole}
                  onChange={(e) => setNewGuestRole(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-[#FAF8FF]"
                >
                  {GUEST_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <select
                  value={newGuestConfirmation}
                  onChange={(e) => setNewGuestConfirmation(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#D8CBF8] bg-[#FAF8FF]"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="No Confirmation">No Confirmation</option>
                  <option value="Not Going">Not Going</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#6B469B] text-white hover:bg-[#583585] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Guest
                </button>
              </form>
            </div>

            {/* Search & Role Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#E6DEFA]">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#7C5CBF]" />
                <input
                  type="text"
                  placeholder="Search guest by name..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-[#2D223B] focus:outline-none w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#7C5CBF]" />
                <select
                  value={guestRoleFilter}
                  onChange={(e) => setGuestRoleFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                >
                  <option value="All">All Roles ({guests.length})</option>
                  {GUEST_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} ({guests.filter((g) => g.role === r).length})
                    </option>
                  ))}
                </select>
                <select
                  value={guestStatusFilter}
                  onChange={(e) => setGuestStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[#D8CBF8] bg-white"
                >
                  <option value="All">All RSVP Status</option>
                  <option value="Confirmed">Confirmed ({confirmedGuestsCount})</option>
                  <option value="No Confirmation">No Confirmation ({pendingGuestsCount})</option>
                  <option value="Not Going">Not Going ({declinedGuestsCount})</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6DEFA] text-[11px] uppercase text-[#7C5CBF] bg-[#FAF8FF]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role / Group</th>
                    <th className="py-3 px-4">Confirmation Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECFF] text-xs sm:text-sm">
                  {filteredGuests.map((guest, idx) => (
                    <tr key={guest.id} className="hover:bg-[#FAF8FF]">
                      <td className="py-3 px-4 text-[#8E7DA6] font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-[#2D223B]">{guest.full_name}</td>
                      <td className="py-3 px-4">
                        <select
                          value={guest.role}
                          onChange={(e) => updateGuestRole(guest.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-[#F3EEFF] text-[#4A2E6E] text-xs font-medium border border-[#E2D6FC]"
                        >
                          {GUEST_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={guest.confirmation}
                          onChange={(e) => updateGuestConfirmation(guest.id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                            guest.confirmation === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : guest.confirmation === 'Not Going'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="No Confirmation">No Confirmation</option>
                          <option value="Not Going">Not Going</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Delete guest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
