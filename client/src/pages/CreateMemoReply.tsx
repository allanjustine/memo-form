import React, { useState, useEffect, ChangeEvent } from "react";
import Select from "react-select/dist/declarations/src/Select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "@heroicons/react/24/solid";
import AddBranchHead from "./AddBranchHead";
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller, set } from "react-hook-form";
import { custom, z, ZodError } from "zod";
import axios from "axios";
import RequestSuccessModal from "../components/Modals/RequestSuccessModal";
import ClipLoader from "react-spinners/ClipLoader";
import AddCustomModal from "./AddCustomModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { error } from "console";
import AddApproverReply from "./AddApproverReply";
import { useLocation } from "react-router-dom";

type CustomApprover = {
  id: number;
  name: string;
  approvers: {
    noted_by: { name: string }[];
    approved_by: { name: string }[];
  };
};
interface Approver {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}
const schema = z.object({
  date: z.date(),
  re: z.string().optional(),
  memo_body: z
    .string()
    .min(20, "Message cannot be empty or less than 20 characters"),
  approver: z.string().nullable().optional(),
  to: z.number().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {};
type Record = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  branch_code: string;
  email: string;
  role: string;
  contact: string;
  userName: string;
  branch: string;
  position: string;
};
const inputStyle =
  "w-full   border-2 border-black rounded-[12px] pl-[10px] bg-white  autofill-input";
const itemDiv = "flex flex-col ";
const buttonStyle = "h-[45px] w-[150px] rounded-[12px] text-white";
const CreateMemoReply = (props: Props) => {
  const [startDate, setStartDate] = useState(new Date());
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const userId = localStorage.getItem("id");
  const [file, setFile] = useState<File[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [notedBy, setNotedBy] = useState<Approver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvedBy, setApprovedBy] = useState<Approver[]>([]);
  const [initialBranchHeads, setInitialBranchHeads] = useState<Approver[]>([]);
  const [initialApprovedBy, setInitialApprovedBy] = useState<Approver[]>([]);
  const [selectedApproverList, setSelectedApproverList] = useState<
    number | null
  >(null);
  const [selectedApprover, setSelectedApprover] = useState<{ name: string }[]>(
    []
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [userList, setUserList] = useState<Record[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Record[]>([]);
  const [filteredUserList, setFilteredUserList] = useState<Record[]>([]);
  const location = useLocation();
  const { record } = location.state || {};
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInitialBranchHeads(notedBy);
   
  }, [notedBy]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!userId) {
          console.error("User ID is missing");
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token is missing");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const response = await axios.get(
          `http://localhost:8000/api/view-all-users`,
          { headers }
        );

   
        setUserList(response.data.data);
        setFilteredUserList(response.data);
      } catch (error) {
        console.error("Error fetching users data:", error);
      }
    };

    fetchUserData();
  }, [userId]);
  console.log("Form errors:", errors);
  const handleOpenConfirmationModal = () => {
    setShowConfirmationModal(true);
  };
  const addRecipient = (user: Record) => {
    setSelectedRecipients((prev) => [...prev, user]);
  };

  const removeRecipient = (userId: number) => {
    setSelectedRecipients((prev) =>
      prev.filter((recipient) => recipient.id !== userId)
    );
  };
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter the user list based on the query
    const filtered = userList.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query)
    );

    setFilteredUserList(filtered);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  // Function to close the confirmation modal
  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
  };

  // Function to handle form submission with confirmation

  const onSubmit = async (data: FormData) => {
    setErrorMessage("");
    try {
      if (!selectedRecipients) {
        setErrorMessage("Cannot be empty");
        return;
      }

      setLoading(true);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");
      /*      const toUserId = localStorage.getItem("toUserId"); // Ensure this is needed
       */
      if (!token || !userId) {
        console.error("Token, userId, or toUserId not found");
        return;
      }
      if (notedBy.length === 0 ) {
        alert("Please select an approver.");
        setLoading(false); // Stop loading state
        return; // Prevent form submission
      }

      const notedByIds = Array.isArray(notedBy)
        ? notedBy.map((person) => person.id)
        : [];

   
      const formData = {
       
        user_id: userId,
        memo_id: record.id,
        explain_body: data.memo_body,
        noted_by: notedByIds,
        date: data.date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log(formData)
      setShowConfirmationModal(true);
      setFormData(formData);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "An error occurred while preparing the request:",
          error.message
        );
      } else {
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleConfirmSubmit = async () => {
    setShowConfirmationModal(false);
    const token = localStorage.getItem("token");

    if (!formData) {
      alert("No form data available.");
      return; // Prevent form submission
    }
    if (!notedBy) {
      alert("Please select an approver.");
      return; // Prevent form submission
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/api/create-explain",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Use application/json if sending JSON
          },
        }
      );
      console.log(response)

      setShowSuccessModal(true);
      setFormSubmitted(true);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "An error occurred while submitting the request:",
          error.message
        );
      } else {
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddCustomModal = () => {
    setIsModalOpen(true);
  };
  const closeAddCustomModal = () => {
    setIsModalOpen(false);
  };
  const handleOpenAddCustomModal = () => {
    setShowAddCustomModal(true);
  };

  const handleCloseAddCustomModal = () => {
    setShowAddCustomModal(false);
  };

  const handleAddCustomData = (notedBy: Approver[]) => {
    setNotedBy(notedBy);
    setApprovedBy(approvedBy);
  };

  const handleCancelSubmit = () => {
    // Close the confirmation modal
    setShowConfirmationModal(false);
    // Reset formData state
    setFormData(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);

    navigate("/request");
  };

  const handleFormSubmit = () => {
    setFormSubmitted(true);
  };

  return (
    <div className="bg-graybg dark:bg-blackbg h-full pt-[15px] px-[30px] pb-[15px]">
      <div className="bg-white w-full  mb-5 rounded-[12px] flex flex-col ">
        <div className="border-b flex justify-between flex-col px-[30px] md:flex-row ">
          <div>
            <h1 className="text-primary dark:text-primaryD text-[32px] font-bold">
              Create Memo
            </h1>
          </div>
          <div className="my-2 ">
            <button
              onClick={openAddCustomModal}
              className="bg-primary text-white p-2 rounded"
            >
              Add Approver
            </button>
          </div>
        </div>
        <div className="px-[35px] mt-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex gap-10 flex-col ">
              <div className="flex flex-col md:flex-row gap-10 w-1/4">
                <div className="relative w-full">
                  <p>Date</p>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => field.onChange(date)}
                          className="border p-2 rounded-md bg-white text-black border-black pl-10"
                        />
                        {/* Calendar Icon */}
                        <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-black z-10">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  />
                  {errors.date && (
                    <p className="text-red-500">{errors.date.message}</p>
                  )}
                </div>
              </div>
              <div className="mb-10 ">
                <h3 className="font-bold mb-3 pt-2">Message:</h3>
                <div className="editor-container h-[300px]">
                  <Controller
                    name="memo_body"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <ReactQuill
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        theme="snow"
                        modules={{
                          toolbar: [
                            [{ header: "1" }, { header: "2" }, { font: [] }],
                            [{ size: [] }],
                            [
                              "bold",
                              "italic",
                              "underline",
                              "strike",
                              "blockquote",
                            ],
                            [
                              { list: "ordered" },
                              { list: "bullet" },
                              { indent: "-1" },
                              { indent: "+1" },
                            ],
                            [{ align: [] }],
                            [{ direction: "rtl" }],

                            ["link", "image", "video"],
                            ["clean"],
                            ["code-block"],
                          ],
                        }}
                        formats={[
                          "header",
                          "font",
                          "size",
                          "bold",
                          "italic",
                          "underline",
                          "strike",
                          "blockquote",
                          "list",
                          "bullet",
                          "indent",
                          "link",
                          "image",
                          "video",
                          "code-block",
                          "align",
                        ]}
                        className="h-[200px]"
                      />
                    )}
                  />
                </div>
                {errors.memo_body && (
                  <p className="text-red-500">{errors.memo_body.message}</p>
                )}
              </div>
            </div>
            <div className="mb-4  mt-20">
              <h3 className="font-bold mb-3">Noted By:</h3>
              <ul className="flex flex-wrap gap-6">
                {notedBy.map((user, index) => (
                  <li key={index} className="text-center">
                    <p>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="font-bold text-[12px]">{user.position}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-10 space-x-3 flex justify-end  pb-10">
              <button
                className={`bg-primary ${buttonStyle}`}
                type="submit"
                onClick={handleFormSubmit}
                disabled={loading}
              >
                {loading ? <ClipLoader color="#36d7b7" /> : "Send Request"}
              </button>
            </div>
            {showConfirmationModal && (
              <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-4 rounded-md">
                  <p>Are you sure you want to submit the request?</p>
                  <div className="flex justify-end mt-4">
                    <button
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                      onClick={handleCloseConfirmationModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                      onClick={handleConfirmSubmit}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <RequestSuccessModal onClose={handleCloseSuccessModal} />
      )}
      <AddBranchHead
        modalIsOpen={isModalOpen}
        closeModal={closeModal}
        openCompleteModal={() => {}}
        entityType="Approver"
        initialBranchHeads={notedBy}
        refreshData={() => {}}
        handleAddCustomData={handleAddCustomData}
      />
    </div>
  );
};

export default CreateMemoReply;
