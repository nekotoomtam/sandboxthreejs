import { useNavigate } from 'react-router'
import { ExperienceShell } from '../experience/ExperienceShell'

export function ExperiencePage() {
  const navigate = useNavigate()
  return <ExperienceShell onEnterWorld={() => navigate('/worlds/foundations')} />
}
