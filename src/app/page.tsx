'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

// --- Types ---
type Person = {
  id: number
  name: string
  parameters: { [key: string]: number }
}

const PARAMETERS = [
  'Programming', 'IQ',
  'Leadership', 'Communication',
  'Scheduling', 'ClientHandling',
  'Politics', 'OrganizationBuilding',
  'Strategy', 'Finance',
]

const LAYERS = [
  { name: 'SE', count: 60, skills: ['Programming', 'IQ'] },
  { name: 'TL', count: 20, skills: ['Leadership', 'Communication'] },
  { name: 'PL', count: 10, skills: ['Scheduling', 'ClientHandling'] },
  { name: '部長', count: 6, skills: ['Politics', 'OrganizationBuilding'] },
  { name: '役員', count: 4, skills: ['Strategy', 'Finance'] },
]

const generatePerson = (id: number, base = 50): Person => {
  const stdDev = 50
  const normal = () => Math.round(base + stdDev * (Math.random() * 2 - 1))
  const params: { [key: string]: number } = {}
  for (const key of PARAMETERS) {
    params[key] = Math.max(0, Math.min(100, normal()))
  }
  return {
    id,
    name: `社員${id + 1}`,
    parameters: params,
  }
}

const randomPromotion = (people: Person[]) => {
  const shuffled = [...people].sort(() => Math.random() - 0.5)
  const result: { [key: string]: Person[] } = {}
  let index = 0
  for (const layer of LAYERS) {
    result[layer.name] = shuffled.slice(index, index + layer.count)
    index += layer.count
  }
  return result
}

const flatSkillBasedPromotion = (people: Person[]) => {
  const remaining = [...people]
  const result: { [key: string]: Person[] } = {}

  for (const layer of LAYERS) {
    const sorted = remaining
      .map(p => ({
        person: p,
        score: layer.skills.reduce((sum, skill) => sum + p.parameters[skill], 0),
      }))
      .sort((a, b) => b.score - a.score)

    const selected = sorted.slice(0, layer.count).map(s => s.person)
    result[layer.name] = selected
    selected.forEach(sel => {
      const i = remaining.findIndex(p => p.id === sel.id)
      if (i !== -1) remaining.splice(i, 1)
    })
  }

  return result
}

const hierarchicalPromotion = (people: Person[]) => {
  const result: { [key: string]: Person[] } = {}
  const pool = [...people]

  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i]
    const prevLayer = i === 0 ? pool : result[LAYERS[i - 1].name]
    const candidates = [...prevLayer]

    const sorted = candidates
      .map(p => ({
        person: p,
        score: layer.skills.reduce((sum, skill) => sum + p.parameters[skill], 0),
      }))
      .sort((a, b) => b.score - a.score)

    const selected = sorted.slice(0, layer.count).map(s => s.person)
    result[layer.name] = selected
  }

  return result
}

const calculateAverages = (org: { [key: string]: Person[] }) => {
  return LAYERS.map(layer => {
    const members = org[layer.name] || []
    const skillSum =
      members.length > 0
        ? members.reduce(
            (sum, p) =>
              sum + layer.skills.reduce((s, skill) => s + p.parameters[skill], 0),
            0
          ) / members.length
        : 0
    const totalSum =
      members.length > 0
        ? members.reduce(
            (sum, p) =>
              sum + Object.values(p.parameters).reduce((a, b) => a + b, 0),
            0
          ) / members.length
        : 0
    return {
      layer: layer.name,
      SkillAverage: parseFloat(skillSum.toFixed(2)),
      TotalAverage: parseFloat(totalSum.toFixed(2)),
    }
  })
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([])
  const [randomOrg, setRandomOrg] = useState<{ [key: string]: Person[] }>({})
  const [skillOrg, setSkillOrg] = useState<{ [key: string]: Person[] }>({})
  const [chartData, setChartData] = useState<{
    layer: string
    RandomSkill: number
    RandomTotal: number
    SkillSkill: number
    SkillTotal: number
  }[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [promotionType, setPromotionType] = useState<'flat' | 'hierarchical'>('flat')

  const recalculate = () => {
    const team = Array.from({ length: 100 }, (_, i) => generatePerson(i))
    setPeople(team)

    const random = randomPromotion(team)
    const skill =
      promotionType === 'flat'
        ? flatSkillBasedPromotion(team)
        : hierarchicalPromotion(team)

    setRandomOrg(random)
    setSkillOrg(skill)

    const randAvg = calculateAverages(random)
    const skillAvg = calculateAverages(skill)

    const merged = randAvg.map((item, idx) => ({
      layer: item.layer,
      RandomSkill: item.SkillAverage,
      RandomTotal: item.TotalAverage,
      SkillSkill: skillAvg[idx].SkillAverage,
      SkillTotal: skillAvg[idx].TotalAverage,
    }))
    setChartData(merged)
    setSelectedPerson(null)
  }

  useEffect(() => {
    recalculate()
  }, [promotionType])

  return (
    <main className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">ピーターの法則 昇進シミュレーション</h1>
        <div className="mb-6 bg-gray-800 p-4 rounded text-sm leading-relaxed">
          <p className="mb-2">
            本シミュレーションは、組織内における昇進の仕組みが人材の能力とどのように関連しているかを可視化するためのものです。100人の社員に対して、各レイヤー（SE、TL、PL、部長、役員）ごとに必要とされるスキルを定義し、そのスキルに基づいて昇進を行います。
          </p>
          <ul className="list-disc list-inside mb-2">
            <li><strong>フラット昇進：</strong> 各階層に必要なスキルを持つ人材を、全社員の中から直接抽出します。</li>
            <li><strong>階層的昇進：</strong> 一段階ずつ昇進させ、前の役職で優秀だった人が次に進む、ピーターの法則を再現します。</li>
          </ul>
          <p>
            各レイヤーの「必要スキル平均」および「合計スコア平均」がグラフに表示され、組織全体のスキル適合度を比較できます。また、画面下部には現在のシミュレーションでの「必要スキル平均の合計スコア」も表示され、どちらの昇進方法がトータルとして優れているかが一目でわかります。
          </p>
        </div>
      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            value="flat"
            checked={promotionType === 'flat'}
            onChange={() => setPromotionType('flat')}
            className="mr-1"
          />
          フラット昇進
        </label>
        <label>
          <input
            type="radio"
            value="hierarchical"
            checked={promotionType === 'hierarchical'}
            onChange={() => setPromotionType('hierarchical')}
            className="mr-1"
          />
          階層的昇進
        </label>
      </div>

      <button
        onClick={recalculate}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
      >
        再計算
      </button>

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">📊 各レイヤーの平均スコア比較</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="layer" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="RandomSkill" fill="#8884d8" name="ランダム昇進 (必要スキル平均)" />
            <Bar dataKey="RandomTotal" fill="#a3bffa" name="ランダム昇進 (合計スコア平均)" />
            <Bar dataKey="SkillSkill" fill="#82ca9d" name="実力昇進 (必要スキル平均)" />
            <Bar dataKey="SkillTotal" fill="#c6f6d5" name="実力昇進 (合計スコア平均)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {chartData.length > 0 && (
        <div className="mb-12 text-sm bg-gray-800 p-4 rounded">
          <p className="mb-1">
            <strong>🔢 必要スキル平均の合計スコア（全レイヤー合算）</strong>
          </p>
          <p>ランダム昇進：{chartData.reduce((sum, d) => sum + d.RandomSkill, 0).toFixed(2)}</p>
          <p>実力昇進：{chartData.reduce((sum, d) => sum + d.SkillSkill, 0).toFixed(2)}</p>
        </div>
      )}


      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">🎲 ランダム昇進</h2>
          {Object.entries(randomOrg).map(([layer, members]) => (
            <section key={layer} className="mb-4">
              <h3 className="text-lg font-semibold">{layer}（{members.length}人）</h3>
              <ul className="text-sm">
                {members.map(p => {
                  const totalScore = Object.values(p.parameters).reduce((a, b) => a + b, 0)
                  return (
                    <li
                      key={p.id}
                      onClick={() => setSelectedPerson(p)}
                      className="cursor-pointer hover:underline"
                    >
                      {p.name} (合計スコア: {totalScore})
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">📈 実力昇進</h2>
          {Object.entries(skillOrg).map(([layer, members]) => (
            <section key={layer} className="mb-4">
              <h3 className="text-lg font-semibold">{layer}（{members.length}人）</h3>
              <ul className="text-sm">
                {members.map(p => {
                  const totalScore = Object.values(p.parameters).reduce((a, b) => a + b, 0)
                  return (
                    <li
                      key={p.id}
                      onClick={() => setSelectedPerson(p)}
                      className="cursor-pointer hover:underline"
                    >
                      {p.name} (合計スコア: {totalScore})
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {selectedPerson && (
        <div className="mt-12 bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">{selectedPerson.name} のスキル詳細</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={PARAMETERS.map(p => ({
              subject: p,
              A: selectedPerson.parameters[p],
            }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" stroke="#ccc" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ccc" />
              <Radar name={selectedPerson.name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </main>
  )
}
