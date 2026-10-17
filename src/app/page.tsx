'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Heart,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

type WeddingDetails = {
  id: string
  couple_names: string
  wedding_date: string
  venue: string
  total_budget: number
}

type Guest = {
  id: string
  full_name: string
  email: string | null
  side: string
  rsvp_status: 'attending' | 'pending' | 'declined'
  meal_preference: string
  plus_one: boolean
  table_number: number | null
}

type BudgetItem = {
  id: string
  category: string
  title: string
  estimated_cost: number
  actual_cost: number
  paid: boolean
}

type ChecklistTask = {
  id: string
  title: string
  category: string
  due_date: string | null
  completed: boolean
}

export default function WeddingPlannerDashboard() {
  const [details, setDetails] = useState<WeddingDetails | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'budget' | 'checklist'>('overview')

  // Form states
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestSide, setNewGuestSide] = useState('Both')
  const [newGuestMeal, setNewGuestMeal] = useState('Standard')

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('General')
  const [newTaskDate, setNewTaskDate] = useState('')

  const [newBudgetCategory, setNewBudgetCategory] = useState('Venue')
  const [newBudgetTitle, setNewBudgetTitle] = useState('')
  const [newBudgetEstimated, setNewBudgetEstimated] = useState('')
  const [newBudgetActual, setNewBudgetActual] = useState('')

  async function fetchAllData() {
    setLoading(true)
    const [detailsRes, guestsRes, budgetRes, tasksRes] = await Promise.all([
      supabase.from('wedding_details').select('*').limit(1).single(),
      supabase.from('guests').select('*').order('created_at', { ascending: true }),
      supabase.from('budget_items').select('*').order('created_at', { ascending: true }),
      supabase.from('checklist_tasks').select('*').order('due_date', { ascending: true }),
    ])

    if (detailsRes.data) setDetails(detailsRes.data)
    if (guestsRes.data) setGuests(guestsRes.data)
    if (budgetRes.data) setBudgetItems(budgetRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  async function toggleTask(task: ChecklistTask) {
    const updated = !task.completed
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: updated } : t)))
    await supabase.from('checklist_tasks').update({ completed: updated }).eq('id', task.id)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    const { data } = await supabase
      .from('checklist_tasks')
      .insert([
        {
          title: newTaskTitle.trim(),
          category: newTaskCategory,
          due_date: newTaskDate || null,
          completed: false,
        },
      ])
      .select()
      .single()
    if (data) {
      setTasks((prev) => [...prev, data])
      setNewTaskTitle('')
      setNewTaskDate('')
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('checklist_tasks').delete().eq('id', id)
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!newGuestName.trim()) return
    const { data } = await supabase
      .from('guests')
      .insert([
        {
          full_name: newGuestName.trim(),
          side: newGuestSide,
          meal_preference: newGuestMeal,
          rsvp_status: 'pending',
        },
      ])
      .select()
      .single()
    if (data) {
      setGuests((prev) => [...prev, data])
      setNewGuestName('')
    }
  }

  async function updateGuestRsvp(id: string, status: Guest['rsvp_status']) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, rsvp_status: status } : g)))
    await supabase.from('guests').update({ rsvp_status: status }).eq('id', id)
  }

  async function deleteGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id))
    await supabase.from('guests').delete().eq('id', id)
  }

  async function addBudgetItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newBudgetTitle.trim()) return
    const { data } = await supabase
      .from('budget_items')
      .insert([
        {
          category: newBudgetCategory,
          title: newBudgetTitle.trim(),
          estimated_cost: Number(newBudgetEstimated) || 0,
          actual_cost: Number(newBudgetActual) || 0,
          paid: false,
        },
      ])
      .select()
      .single()
    if (data) {
      setBudgetItems((prev) => [...prev, data])
      setNewBudgetTitle('')
      setNewBudgetEstimated('')
      setNewBudgetActual('')
    }
  }

  async function toggleBudgetPaid(item: BudgetItem) {
    const updated = !item.paid
    setBudgetItems((prev) => prev.map((b) => (b.id === item.id ? { ...b, paid: updated } : b)))
    await supabase.from('budget_items').update({ paid: updated }).eq('id', item.id)
  }

  async function deleteBudgetItem(id: string) {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('budget_items').delete().eq('id', id)
  }

  const attendingCount = guests.filter((g) => g.rsvp_status === 'attending').length
  const totalSpent = budgetItems.reduce((sum, item) => sum + Number(item.actual_cost || 0), 0)
  const totalEstimated = budgetItems.reduce((sum, item) => sum + Number(item.estimated_cost || 0), 0)
  const completedTasks = tasks.filter((t) => t.completed).length

  const daysUntilWedding = details?.wedding_date
    ? Math.max(
        0,
        Math.ceil((new Date(details.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      )
    : 238

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800">
      {/* Hero Header */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 fill-rose-600 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">
                  {details?.couple_names || 'Joshua & Partner'}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" /> Live on Supabase
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  {details?.wedding_date || 'June 12, 2027'} ({daysUntilWedding} days to go)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {details?.venue || 'The Glasshouse Garden Estates'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['overview', 'guests', 'budget', 'checklist'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              onClick={fetchAllData}
              title="Refresh from Supabase"
              className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider">
              <span>Confirmed Guests</span>
              <Users className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-3xl font-semibold text-stone-900 mt-2">
              {attendingCount} <span className="text-base font-normal text-stone-400">/ {guests.length}</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {guests.filter((g) => g.rsvp_status === 'pending').length} awaiting RSVP
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider">
              <span>Budget Tracker</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-semibold text-stone-900 mt-2">
              ${totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              of ${(details?.total_budget || 35000).toLocaleString()} total budget (${totalEstimated.toLocaleString()} est.)
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider">
              <span>Checklist Progress</span>
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-semibold text-stone-900 mt-2">
              {completedTasks} <span className="text-base font-normal text-stone-400">/ {tasks.length}</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}% milestones completed
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-xs font-medium uppercase tracking-wider">
              <span>Countdown</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-semibold text-stone-900 mt-2">{daysUntilWedding} Days</p>
            <p className="text-xs text-stone-500 mt-1">{details?.venue || 'The Glasshouse Garden Estates'}</p>
          </div>
        </div>

        {/* Tab Content */}
        {(activeTab === 'overview' || activeTab === 'guests') && (
          <section className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Guest List & RSVPs</h2>
                <p className="text-sm text-stone-500">Manage invitations, meal preferences, and RSVP status.</p>
              </div>
              <form onSubmit={addGuest} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Guest full name..."
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
                <select
                  value={newGuestSide}
                  onChange={(e) => setNewGuestSide(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                >
                  <option value="Bride">Bride Side</option>
                  <option value="Groom">Groom Side</option>
                  <option value="Both">Both</option>
                </select>
                <select
                  value={newGuestMeal}
                  onChange={(e) => setNewGuestMeal(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                >
                  <option value="Filet Mignon">Filet Mignon</option>
                  <option value="Salmon">Salmon</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Standard">Standard</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add Guest
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase text-stone-400">
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4">Meal</th>
                    <th className="py-3 px-4">RSVP Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4 font-medium text-stone-900">{guest.full_name}</td>
                      <td className="py-3.5 px-4 text-stone-600">{guest.side}</td>
                      <td className="py-3.5 px-4 text-stone-600">{guest.meal_preference}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={guest.rsvp_status}
                          onChange={(e) => updateGuestRsvp(guest.id, e.target.value as Guest['rsvp_status'])}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            guest.rsvp_status === 'attending'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : guest.rsvp_status === 'declined'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="attending">Attending</option>
                          <option value="pending">Pending</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-stone-400 hover:text-rose-600 transition p-1"
                          title="Remove guest"
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

        {(activeTab === 'overview' || activeTab === 'budget') && (
          <section className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Wedding Budget & Vendors</h2>
                <p className="text-sm text-stone-500">Track estimated vs. actual vendor expenses in real time.</p>
              </div>
              <form onSubmit={addBudgetItem} className="flex flex-wrap items-center gap-2">
                <select
                  value={newBudgetCategory}
                  onChange={(e) => setNewBudgetCategory(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                >
                  <option value="Venue">Venue</option>
                  <option value="Catering">Catering</option>
                  <option value="Photography">Photography</option>
                  <option value="Florals">Florals</option>
                  <option value="Music">Music</option>
                  <option value="Attire">Attire</option>
                </select>
                <input
                  type="text"
                  placeholder="Expense item..."
                  value={newBudgetTitle}
                  onChange={(e) => setNewBudgetTitle(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300"
                />
                <input
                  type="number"
                  placeholder="Est. $"
                  value={newBudgetEstimated}
                  onChange={(e) => setNewBudgetEstimated(e.target.value)}
                  className="w-24 px-3 py-2 text-sm rounded-xl border border-stone-300"
                />
                <input
                  type="number"
                  placeholder="Actual $"
                  value={newBudgetActual}
                  onChange={(e) => setNewBudgetActual(e.target.value)}
                  className="w-24 px-3 py-2 text-sm rounded-xl border border-stone-300"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition"
                >
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase text-stone-400">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor / Item</th>
                    <th className="py-3 px-4">Estimated</th>
                    <th className="py-3 px-4">Actual</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {budgetItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900">{item.title}</td>
                      <td className="py-3.5 px-4 text-stone-600">${Number(item.estimated_cost).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        ${Number(item.actual_cost).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleBudgetPaid(item)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            item.paid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {item.paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteBudgetItem(item.id)}
                          className="text-stone-400 hover:text-rose-600 transition p-1"
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

        {(activeTab === 'overview' || activeTab === 'checklist') && (
          <section className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Planning Checklist</h2>
                <p className="text-sm text-stone-500">Stay on top of every milestone leading up to the big day.</p>
              </div>
              <form onSubmit={addTask} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="New milestone task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300"
                />
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </form>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/70 hover:bg-stone-50/70 transition"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="text-xs text-stone-400">
                        {task.category} {task.due_date ? `• Due ${task.due_date}` : ''}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-stone-400 hover:text-rose-600 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
