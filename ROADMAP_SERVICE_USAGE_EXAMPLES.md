# RoadmapService Usage Examples

## Import the Service

```typescript
import { roadmapService } from '@/services/roadmap.service';
```

## Example 1: Generate a New Roadmap

```typescript
async function generateMathRoadmap(studentId: string) {
  try {
    const roadmap = await roadmapService.generateRoadmap({
      studentId: studentId,
      subject: 'Математика'
    });
    
    console.log('Roadmap generated:', roadmap.id);
    console.log('Topics:', roadmap.content.topics.length);
    console.log('Duration:', roadmap.content.estimated_duration);
    console.log('Difficulty:', roadmap.content.difficulty_level);
    
    return roadmap;
  } catch (error: any) {
    if (error.code === 'INSUFFICIENT_COINS') {
      console.error('Not enough wisdom coins!');
      console.error(`You have ${error.currentBalance} but need ${error.requiredAmount}`);
    } else {
      console.error('Failed to generate roadmap:', error.message);
    }
    throw error;
  }
}
```

## Example 2: Get All Roadmaps for a Student

```typescript
async function getStudentRoadmaps(studentId: string) {
  try {
    const roadmaps = await roadmapService.getRoadmaps(studentId);
    
    console.log(`Found ${roadmaps.length} roadmaps`);
    
    roadmaps.forEach(roadmap => {
      console.log(`- ${roadmap.subject}: ${roadmap.progress.completion_percentage}% complete`);
    });
    
    return roadmaps;
  } catch (error: any) {
    console.error('Failed to fetch roadmaps:', error.message);
    throw error;
  }
}
```

## Example 3: Get a Specific Roadmap

```typescript
async function getRoadmapDetails(roadmapId: string, studentId: string) {
  try {
    const roadmap = await roadmapService.getRoadmap(roadmapId, studentId);
    
    console.log('Roadmap:', roadmap.subject);
    console.log('Progress:', roadmap.progress.completion_percentage + '%');
    console.log('Current topic:', roadmap.progress.current_topic);
    console.log('Completed topics:', roadmap.progress.completed_topics.length);
    
    // Display all topics
    roadmap.content.topics.forEach(topic => {
      const isCompleted = roadmap.progress.completed_topics.includes(topic.id);
      const isCurrent = roadmap.progress.current_topic === topic.id;
      
      console.log(`${isCompleted ? '✓' : '○'} ${topic.title}${isCurrent ? ' (current)' : ''}`);
      console.log(`  ${topic.description}`);
      console.log(`  Resources: ${topic.resources.join(', ')}`);
      console.log(`  Milestones: ${topic.milestones.join(', ')}`);
    });
    
    return roadmap;
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      console.error('Roadmap not found');
    } else if (error.code === 'UNAUTHORIZED') {
      console.error('You do not have access to this roadmap');
    } else {
      console.error('Failed to fetch roadmap:', error.message);
    }
    throw error;
  }
}
```

## Example 4: Mark a Topic as Completed

```typescript
async function completeTopicInRoadmap(
  roadmapId: string, 
  studentId: string, 
  topicId: string
) {
  try {
    const updatedRoadmap = await roadmapService.updateProgress({
      roadmapId,
      studentId,
      completedTopicId: topicId
    });
    
    console.log('Topic completed!');
    console.log('New progress:', updatedRoadmap.progress.completion_percentage + '%');
    console.log('Next topic:', updatedRoadmap.progress.current_topic);
    
    // Check if roadmap is fully completed
    if (updatedRoadmap.progress.completion_percentage === 100) {
      console.log('🎉 Congratulations! Roadmap completed!');
    }
    
    return updatedRoadmap;
  } catch (error: any) {
    if (error.code === 'INVALID_TOPIC') {
      console.error('Topic not found in roadmap');
    } else {
      console.error('Failed to update progress:', error.message);
    }
    throw error;
  }
}
```

## Example 5: Delete a Roadmap

```typescript
async function deleteStudentRoadmap(roadmapId: string, studentId: string) {
  try {
    await roadmapService.deleteRoadmap(roadmapId, studentId);
    console.log('Roadmap deleted successfully');
  } catch (error: any) {
    if (error.code === 'UNAUTHORIZED') {
      console.error('You cannot delete this roadmap');
    } else {
      console.error('Failed to delete roadmap:', error.message);
    }
    throw error;
  }
}
```

## Example 6: Complete React Component Usage

```typescript
import React, { useState, useEffect } from 'react';
import { roadmapService } from '@/services/roadmap.service';
import type { LearningRoadmap } from '@/types/platform';

function RoadmapGenerator({ studentId }: { studentId: string }) {
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);

  const handleGenerate = async () => {
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newRoadmap = await roadmapService.generateRoadmap({
        studentId,
        subject: subject.trim()
      });
      
      setRoadmap(newRoadmap);
      setSubject('');
    } catch (err: any) {
      if (err.code === 'INSUFFICIENT_COINS') {
        setError(`Not enough Wisdom Coins. You have ${err.currentBalance} but need ${err.requiredAmount}.`);
      } else {
        setError(err.message || 'Failed to generate roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generate Learning Roadmap</h2>
      <p>Cost: 4 Wisdom Coins</p>
      
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Enter subject (e.g., Математика)"
        disabled={loading}
      />
      
      <button onClick={handleGenerate} disabled={loading || !subject.trim()}>
        {loading ? 'Generating...' : 'Generate Roadmap'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {roadmap && (
        <div className="roadmap-result">
          <h3>Roadmap Generated!</h3>
          <p>Subject: {roadmap.subject}</p>
          <p>Duration: {roadmap.content.estimated_duration}</p>
          <p>Difficulty: {roadmap.content.difficulty_level}</p>
          <p>Topics: {roadmap.content.topics.length}</p>
        </div>
      )}
    </div>
  );
}

function RoadmapProgress({ roadmapId, studentId }: { roadmapId: string; studentId: string }) {
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmap();
  }, [roadmapId]);

  const loadRoadmap = async () => {
    try {
      const data = await roadmapService.getRoadmap(roadmapId, studentId);
      setRoadmap(data);
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTopicClick = async (topicId: string) => {
    try {
      const updated = await roadmapService.updateProgress({
        roadmapId,
        studentId,
        completedTopicId: topicId
      });
      setRoadmap(updated);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!roadmap) return <div>Roadmap not found</div>;

  return (
    <div>
      <h2>{roadmap.subject} Roadmap</h2>
      <div className="progress-bar">
        <div style={{ width: `${roadmap.progress.completion_percentage}%` }}>
          {roadmap.progress.completion_percentage}%
        </div>
      </div>
      
      <div className="topics">
        {roadmap.content.topics.map(topic => {
          const isCompleted = roadmap.progress.completed_topics.includes(topic.id);
          const isCurrent = roadmap.progress.current_topic === topic.id;
          
          return (
            <div key={topic.id} className={`topic ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              
              <div className="resources">
                <h4>Resources:</h4>
                <ul>
                  {topic.resources.map((resource, i) => (
                    <li key={i}>{resource}</li>
                  ))}
                </ul>
              </div>
              
              <div className="milestones">
                <h4>Milestones:</h4>
                <ul>
                  {topic.milestones.map((milestone, i) => (
                    <li key={i}>{milestone}</li>
                  ))}
                </ul>
              </div>
              
              {!isCompleted && (
                <button onClick={() => handleCompleteTopicClick(topic.id)}>
                  Mark as Completed
                </button>
              )}
              
              {isCompleted && <span className="checkmark">✓ Completed</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { RoadmapGenerator, RoadmapProgress };
```

## Error Handling Best Practices

```typescript
async function handleRoadmapOperation() {
  try {
    // Your roadmap operation here
    const result = await roadmapService.generateRoadmap({...});
    return result;
  } catch (error: any) {
    // Handle specific error codes
    switch (error.code) {
      case 'INSUFFICIENT_COINS':
        // Show user their balance and required amount
        showError(`Need ${error.requiredAmount} coins, you have ${error.currentBalance}`);
        break;
      
      case 'MISSING_FIELDS':
        // Validation error
        showError('Please fill in all required fields');
        break;
      
      case 'NOT_FOUND':
        // Roadmap not found
        showError('Roadmap not found');
        break;
      
      case 'UNAUTHORIZED':
        // Access denied
        showError('You do not have access to this roadmap');
        break;
      
      case 'INVALID_TOPIC':
        // Invalid topic ID
        showError('Topic not found in roadmap');
        break;
      
      default:
        // Generic error
        showError(error.message || 'An error occurred');
    }
    
    // Log for debugging
    console.error('Roadmap operation failed:', error);
    
    // Re-throw if needed
    throw error;
  }
}
```

## Integration with Token Economy

```typescript
import { tokenEconomyService } from '@/services/token-economy.service';
import { roadmapService } from '@/services/roadmap.service';

async function checkAndGenerateRoadmap(studentId: string, subject: string) {
  // Check balance first
  const balance = await tokenEconomyService.getBalance(studentId);
  const cost = 4; // Roadmap generation cost
  
  if (balance < cost) {
    console.log(`Insufficient balance: ${balance} coins (need ${cost})`);
    return null;
  }
  
  console.log(`Current balance: ${balance} coins`);
  console.log(`After generation: ${balance - cost} coins`);
  
  // Generate roadmap (will deduct coins automatically)
  const roadmap = await roadmapService.generateRoadmap({
    studentId,
    subject
  });
  
  // Verify new balance
  const newBalance = await tokenEconomyService.getBalance(studentId);
  console.log(`New balance: ${newBalance} coins`);
  
  return roadmap;
}
```

## Tips and Best Practices

1. **Always handle errors**: The service throws specific error codes that you should handle appropriately
2. **Check balance first**: Display the cost and current balance before allowing generation
3. **Show progress**: The generation can take 5-10 seconds, show a loading indicator
4. **Cache roadmaps**: Store fetched roadmaps in state to avoid unnecessary API calls
5. **Validate inputs**: Check that subject is not empty before calling the service
6. **Handle AI failures**: The service provides a fallback roadmap if AI fails
7. **Update UI on progress**: Refresh the roadmap display after marking topics complete
8. **Authorization**: Always pass the correct studentId for authorization checks
