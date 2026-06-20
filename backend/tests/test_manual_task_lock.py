import unittest

from backend.workflow.dag_engine.dag_engine import SyncFieldDAG


class ManualTaskLockTests(unittest.TestCase):
    def test_explicit_lock_survives_graph_evaluation(self):
        engine = SyncFieldDAG([{
            "task_id": "T_LOCKED",
            "task_name": "Await operator release",
            "state": "LOCKED",
            "manual_lock": True,
            "dependencies": [],
        }])

        self.assertEqual(engine.tasks["T_LOCKED"]["state"], "LOCKED")

    def test_operator_release_clears_manual_lock(self):
        engine = SyncFieldDAG([{
            "task_id": "T_LOCKED",
            "task_name": "Await operator release",
            "state": "LOCKED",
            "manual_lock": True,
            "dependencies": [],
        }])

        engine.update_task_state("T_LOCKED", "READY", "Manual operator update")

        self.assertEqual(engine.tasks["T_LOCKED"]["state"], "READY")
        self.assertFalse(engine.tasks["T_LOCKED"]["manual_lock"])

    def test_dependency_lock_still_releases_automatically(self):
        engine = SyncFieldDAG([{
            "task_id": "T_DEPENDENCY_LOCK",
            "task_name": "Dependency-controlled task",
            "state": "LOCKED",
            "dependencies": [],
        }])

        self.assertEqual(engine.tasks["T_DEPENDENCY_LOCK"]["state"], "READY")


if __name__ == "__main__":
    unittest.main()
